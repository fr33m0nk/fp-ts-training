// `fp-ts` training Exercise 1
// Basic types:
// - Option
// - Either
// - TaskEither

import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { sleep } from '../utils';
import { pipe } from 'fp-ts/function';

export const divide = (a: number, b: number): number => {
  return a / b;
};

///////////////////////////////////////////////////////////////////////////////
//                                  OPTION                                   //
///////////////////////////////////////////////////////////////////////////////

// Write the safe version (meaning it handles the case where b is 0) of `divide` with signature:
// safeDivide : (a: number, b: number) => Option<number>
//
// HINT: Option has two basic constructors:
// - `option.some(value)`
// - `option.none`

type SafeDivide = (a: number, b: number) => O.Option<number>
export const safeDivide: SafeDivide = (a, b) =>
  pipe(b,
    O.fromPredicate(n => n !== 0),
    O.map(n => a / n));

// You probably wrote `safeDivide` using `if` statements, and it's perfectly valid!
// There are ways to not use `if` statements.
// Keep in mind that extracting small functions out of pipes and using `if` statements in them
// is perfectly fine and is sometimes more readable than not using `if`.
//
// BONUS: Try now to re-write `safeDivide` without any `if`
//
// HINT: Have a look at `fromPredicate` constructor

///////////////////////////////////////////////////////////////////////////////
//                                  EITHER                                   //
///////////////////////////////////////////////////////////////////////////////

// Write the safe version of `divide` with signature:
// safeDivideWithError : (a: number, b: number) => Either<DivideByZeroError, number>
//
// BONUS POINT: Implement `safeDivideWithError` in terms of `safeDivide`.
//
// HINT : Either has two basic constructors:
// - `either.left(leftValue)`
// - `either.right(rightValue)`
// as well as "smarter" constructors like:
// - `either.fromOption(() => leftValue)(option)`

// Here is a simple error type to help you:
export type DivisionByZeroError = 'Error: Division by zero';
export const DivisionByZero = 'Error: Division by zero' as const;

type SafeDivideWithError = (a: number, b: number) => E.Either<DivisionByZeroError, number>
export const safeDivideWithError: SafeDivideWithError = (a, b) =>
  pipe(
    b,
    E.fromPredicate(n => n !== 0, () => DivisionByZero),
    E.map(n => a / n),
  );

///////////////////////////////////////////////////////////////////////////////
//                                TASKEITHER                                 //
///////////////////////////////////////////////////////////////////////////////

// Now let's say we have a (pretend) API call that will perform the division for us
// (throwing an error when the denominator is 0)
export const asyncDivide = async (a: number, b: number) => {
  await sleep(1000);

  if (b === 0) {
    throw new Error('BOOM!');
  }

  return a / b;
};

// Write the safe version of `asyncDivide` with signature:
// asyncSafeDivideWithError : (a: number, b: number) => TaskEither<DivideByZeroError, number>
//
// HINT: TaskEither has a special constructor to transform a Promise<T> into
// a TaskEither<Error, T>:
// - `taskEither.tryCatch(f: () => promise, onReject: reason => leftValue)`

type AsyncSafeDivideWithError = (a: number, b: number) => TE.TaskEither<DivisionByZeroError, number>
export const asyncSafeDivideWithError: AsyncSafeDivideWithError = (a, b) =>
  TE.tryCatch(
    () => asyncDivide(a, b),
    () => DivisionByZero,
  );
