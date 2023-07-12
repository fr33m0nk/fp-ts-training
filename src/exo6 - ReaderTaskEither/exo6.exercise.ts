// `fp-ts` training Exercise 6
// Introduction to `ReaderTaskEither`

import { readerTaskEither as rte } from 'fp-ts';
import { ReaderTaskEither } from 'fp-ts/lib/ReaderTaskEither';
import { Application } from './application';
import { User } from './domain';
import { pipe } from 'fp-ts/function';

// In real world applications you will mostly manipulate `ReaderTaskEither` aka
// `rte` in the use-cases of the application.
// `Reader` -> For dependency injection
// `Task` -> For async operation
// `Either` -> For computations that may fail
//
// Keep in mind, a ReaderTaskEither is nothing more than a Reader of a Task of an Either
// type ReaderTaskEither<Env, Error, Value> = Reader<Env, Task<Either<Error, Value>>>
//
// The ReaderTaskEither module from fp-ts gives us some useful methods to manipulate it.
// You will learn the usage of the most common in the following use-cases.

// In the following use-case, you will learn the usage of `rte.map()`.
// `rte.map()` allows you to perform an operation on the values stored in the
// current context. In the following example, we need to fetch a user by its id,
// and then we want to return its name capitalized.

const capitalize = (str: string) =>
  `${str.charAt(0).toUpperCase()}${str.slice(1)}`;

export const getCapitalizedUserName: (args: {
  userId: string;
}) => ReaderTaskEither<
  User.Repository.Access,
  User.Repository.UserNotFoundError,
  string
> = ({userId}) => pipe (
  userId,
  User.Repository.getById,
  rte.map(x => capitalize(x.name))
)


// Sometimes you will need to get multiple data points before performing an operation
// on them. In this case, it is very convenient to use the `Do` notation.
//
// The `Do` notation allows you to enrich the context step-by-step by binding
// the result of an effect (in this case a RTE) to a named variable using
// `rte.apS` or `rte.apSW`.
//
// For example:
// pipe(
//  rte.Do,
//  rte.apS('myDataOne', DataSource.getById(x)),
//  ...
// )

export const getConcatenationOfTheTwoUserNames: (args: {
  userIdOne: string;
  userIdTwo: string;
}) => ReaderTaskEither<
  User.Repository.Access,
  User.Repository.UserNotFoundError,
  string
> = ({ userIdOne, userIdTwo }) => pipe(
  rte.Do,
  rte.apS(
    'userOneCapitalizedName',
    getCapitalizedUserName({ userId: userIdOne }),
  ),
  rte.apS(
    'userTwoCapitalizedName',
    getCapitalizedUserName({ userId: userIdTwo }),
  ),
  rte.map( ({ userOneCapitalizedName, userTwoCapitalizedName }) => userOneCapitalizedName.concat(userTwoCapitalizedName))
)

// There is an alternative way of writing the previous function without the
// Do notation. It consists of "lifting" the concatenation function in a rte
// (using `rte.of()` or `rte.right()`) and then applying the (lifted) arguments
// one after the other using `rte.ap()`. For this to work, you need to have
// a curried version of the concatenation function:
// const concat: (x: string) => (y: string) => string
//
// Write another version of getConcatenationOfTheTwoUserNames function
// using `rte.ap()`:

const concatCurried: (x: string) => (y: string) => string = x => y => x.concat(y)

export const getConcatenationOfTheTwoUserNamesUsingAp: (args: {
  userIdOne: string;
  userIdTwo: string;
}) => ReaderTaskEither<
  User.Repository.Access,
  User.Repository.UserNotFoundError,
  string
> = ({
  userIdOne,
  userIdTwo
}) => pipe(
  rte.of(concatCurried),
  rte.ap(getCapitalizedUserName({ userId: userIdOne })),
  rte.ap(getCapitalizedUserName({ userId: userIdTwo })),
)

// Sometimes, you will need to feed the current context with data that you can
// only retrieve after performing some operations, in other words, operations
// need to be sequential.
// For example, if you want to fetch the best friend of a user you will have to
// first fetch the user and then fetch their best friend.
// In this case, we will use `rte.bindW()` to use data of the current context
// (the firstly fetched user) to perform a second operation (fetch their best friend)
// and bind the return value to feed the context and use this data.

export const getConcatenationOfTheBestFriendNameAndUserName: (args: {
  userIdOne: string;
}) => ReaderTaskEither<
  User.Repository.Access,
  User.Repository.UserNotFoundError,
  string
> = ({ userIdOne }) => pipe(
  rte.Do,
  rte.apS('userOne', User.Repository.getById(userIdOne)),
  rte.bind('userTwo', ({ userOne }) =>
    User.Repository.getById(userOne.bestFriendId)
  ),
  rte.map(
    ({ userOne, userTwo }) =>
      `${capitalize(userOne.name)}${capitalize(userTwo.name)}`
  )
)

// Most of the time, you will need to use several external services.
// The challenge of this use-case is to use TimeService in the flow of our `rte`
type Dependencies = User.Repository.Access & Application.TimeService.Access;

export const getConcatenationOfUserNameAndCurrentYear: (args: {
  userIdOne: string;
}) => ReaderTaskEither<
  Dependencies,
  User.Repository.UserNotFoundError,
  string
> = ({
  userIdOne
}) => pipe(
  rte.Do,
  rte.apS('user', User.Repository.getById(userIdOne)),
  rte.apSW('year', rte.fromReader(Application.TimeService.thisYear())),
  rte.map(({ user, year }) => `${user.name}${year}`)

)
