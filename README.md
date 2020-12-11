# Async-Iterator-Merge

## Description
Typescript library to "Merge" multiple async iterators/iterables together

It's a library that 
* Takes a single:
  * `Map<T,AsyncIterator<U>|AsyncIterable<U>>`
    * A Map from an identifier string to AsyncIterators/Iterables you want to merge
* and returns `AsyncIterable` that yields
  * `{id: T,value: U}`
    * An object that contains both the id string of the Iterator/able that yielded a value, as well as the value itself.
