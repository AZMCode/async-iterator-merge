import { t } from "../deps.ts";

export const AsyncIterator = t.Intersect(
    t.Record({
        next: t.Function
    }),
    t.Partial({
        return: t.Function
    }),
    t.Partial({
        throw: t.Function
    })
)


export const AsyncIterable = t.Record({
    [Symbol.asyncIterator]: t.Function
});

export const AsyncIter = t.Union(AsyncIterator, AsyncIterable);