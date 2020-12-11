import { assert } from "https://deno.land/std@0.80.0/testing/asserts.ts";
import { t } from "./deps.ts"
import {AsyncIterable, AsyncIterator} from "./src/AsyncIterTypes.ts"

interface AsyncIterItemTyp<T,U>{
    id: T,
    value: U
}
type AsyncIterTyp<T> = AsyncIterable<T>|AsyncIterator<T>;
type InputTyp<T,U>  = Map<T,AsyncIterTyp<U>>
type ReturnTyp<T,U> = AsyncIterable<AsyncIterItemTyp<T,U>>

export async function promiseRaceIndexed<T>(input:Array<Promise<T>|null>):Promise<AsyncIterItemTyp<number,T>|null>{
    const indexedPromises= input.map((prom,index)=>{
        if(prom === null){
            return null
        } else {
            return (async ()=>(
                {id:index,value: await prom}
            ))()
        }
    });
    let denulledPromises: Array<Promise<{id:number,value: T}>>= [];
    for(const item of indexedPromises){
        if(item !== null){
            denulledPromises.push(item);
        }
    }
    if(denulledPromises.length === 0){
        return Promise.resolve(null);
    } else {
        return await Promise.race(denulledPromises);
    }
}

export function asyncIteratorMerge<T,U>(input:Readonly<InputTyp<T,U>>):ReturnTyp<T,U>{
    const inputEntries = [...input.entries()]
    let iterators: Array<AsyncIterator<U>|null> = inputEntries.map((elm)=>{
        if(AsyncIterable.check(elm[1])){
            return (elm[1] as AsyncIterable<U>)[Symbol.asyncIterator]() as AsyncIterator<U>;
        } else if (AsyncIterator.check(elm[1])){
            return elm[1] as AsyncIterator<U>;
        } else {
            throw new TypeError("AsyncIter was not AsyncIterable or AsyncIterator");
        }
    });
    let promises = iterators.map((elm)=>{
        if(elm === null){
            return null;
        } else {
            return elm.next();
        }
    })
    return {
        [Symbol.asyncIterator]: ()=>({
            next: async ():Promise<IteratorResult<AsyncIterItemTyp<T,U>>>=>{
                const winner = await promiseRaceIndexed(promises);
                if(winner === null){
                    return {value: undefined, done:true};
                } else {
                    const winnerIndex = winner.id;
                    const winnerIterator = iterators[winnerIndex]
                    if(winnerIterator === null){
                        promises[winnerIndex] = null;
                    } else {
                        if(winner.value.done){
                            iterators[winnerIndex] = null;
                            promises[winnerIndex] = null;
                        } else {
                            const nextPromise = winnerIterator.next();
                            promises[winnerIndex] = nextPromise;
                        }
                    }
                }
                const winnerId = inputEntries[winner.id][0];
                return {value:{value:winner.value.value, id:winnerId}, done: false};
            }
        })
    }
}