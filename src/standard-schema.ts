/**
 * Standard Schema V1 — vendored type definitions (no runtime code).
 *
 * Source: https://github.com/standard-schema/standard-schema (v1 spec).
 * Vendored so this package stays dependency-free: any schema library that
 * implements the spec (zod ≥ 3.24, valibot ≥ 1.0, arktype ≥ 2.0, …) is
 * structurally compatible without this package depending on it.
 *
 * Only the shapes needed for type inference and (future) response
 * validation are included. Kept flat (no namespaces) to stay compatible
 * with `erasableSyntaxOnly`.
 */

export interface StandardSchemaPathSegment {
  readonly key: PropertyKey;
}

export interface StandardSchemaIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | StandardSchemaPathSegment> | undefined;
}

export interface StandardSchemaSuccessResult<Output> {
  readonly value: Output;
  readonly issues?: undefined;
}

export interface StandardSchemaFailureResult {
  readonly issues: ReadonlyArray<StandardSchemaIssue>;
}

export type StandardSchemaResult<Output> =
  | StandardSchemaFailureResult
  | StandardSchemaSuccessResult<Output>;

export interface StandardSchemaTypes<Input = unknown, Output = Input> {
  readonly input: Input;
  readonly output: Output;
}

export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
    ) => StandardSchemaResult<Output> | Promise<StandardSchemaResult<Output>>;
    readonly types?: StandardSchemaTypes<Input, Output> | undefined;
  };
}

export type InferStandardInput<Schema extends StandardSchemaV1> = NonNullable<
  Schema['~standard']['types']
>['input'];

export type InferStandardOutput<Schema extends StandardSchemaV1> = NonNullable<
  Schema['~standard']['types']
>['output'];
