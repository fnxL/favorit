import { Static, TSchema, Type } from '@sinclair/typebox';

const Nullable = <T extends TSchema>(schema: T) =>
    Type.Unsafe<Static<T> | null>({
        ...schema,
        nullable: true,
    });

export default Nullable;
