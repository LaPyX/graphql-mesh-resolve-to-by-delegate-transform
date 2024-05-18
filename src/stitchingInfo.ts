import {
    getNamedType,
    isInputObjectType,
    isLeafType,
    isUnionType,
    Kind,
    print,
    type FieldNode,
    type GraphQLObjectType,
    type GraphQLSchema,
    type SelectionSetNode,
} from 'graphql';
import { type StitchingInfo } from '@graphql-tools/delegate';
import { collectFields, parseSelectionSet, type IResolvers } from '@graphql-tools/utils';

export function completeStitchingInfo<TContext = Record<string, any>>(
    stitchingInfo: StitchingInfo<TContext>,
    resolvers: IResolvers,
    schema: GraphQLSchema,
): StitchingInfo<TContext> {
    const { fieldNodesByType, fieldNodesByField, dynamicSelectionSetsByField, mergedTypes } =
        stitchingInfo;

    const rootTypes = [schema.getQueryType(), schema.getMutationType()];
    for (const rootType of rootTypes) {
        if (rootType) {
            fieldNodesByType[rootType.name] = [
                parseSelectionSet('{ __typename }', { noLocation: true })
                    .selections[0] as FieldNode,
            ];
        }
    }

    const selectionSetsByField: Record<string, Record<string, SelectionSetNode[]>> = Object.create(
        null,
    );
    for (const typeName in mergedTypes) {
        const mergedTypeInfo = mergedTypes[typeName];
        if (mergedTypeInfo.selectionSets == null && mergedTypeInfo.fieldSelectionSets == null) {
            continue;
        }

        for (const [subschemaConfig, selectionSet] of mergedTypeInfo.selectionSets) {
            const schema = subschemaConfig.transformedSchema;
            const type = schema.getType(typeName) as GraphQLObjectType;
            const fields = type.getFields();
            for (const fieldName in fields) {
                const field = fields[fieldName];
                const fieldType = getNamedType(field.type);
                if (
                    selectionSet &&
                    isLeafType(fieldType) &&
                    selectionSetContainsTopLevelField(selectionSet, fieldName)
                ) {
                    continue;
                }
                updateSelectionSetMap(
                    selectionSetsByField,
                    typeName,
                    fieldName,
                    selectionSet,
                    true,
                );
            }
        }

        for (const [, selectionSetFieldMap] of mergedTypeInfo.fieldSelectionSets) {
            for (const fieldName in selectionSetFieldMap) {
                const selectionSet = selectionSetFieldMap[fieldName];
                updateSelectionSetMap(
                    selectionSetsByField,
                    typeName,
                    fieldName,
                    selectionSet,
                    true,
                );
            }
        }
    }

    for (const typeName in resolvers) {
        const type = schema.getType(typeName);
        if (
            type === undefined ||
            isLeafType(type) ||
            isInputObjectType(type) ||
            isUnionType(type)
        ) {
            continue;
        }
        const resolver = resolvers[typeName];
        for (const fieldName in resolver) {
            const field = (resolver as any)[fieldName];
            if (typeof field.selectionSet === 'function') {
                if (!(typeName in dynamicSelectionSetsByField)) {
                    dynamicSelectionSetsByField[typeName] = Object.create(null);
                }

                if (!(fieldName in dynamicSelectionSetsByField[typeName])) {
                    dynamicSelectionSetsByField[typeName][fieldName] = [];
                }

                dynamicSelectionSetsByField[typeName][fieldName].push(field.selectionSet);
            } else if (field.selectionSet) {
                const selectionSet = parseSelectionSet(field.selectionSet, { noLocation: true });
                updateSelectionSetMap(selectionSetsByField, typeName, fieldName, selectionSet);
            }
        }
    }

    const variableValues = Object.create(null);
    const fragments = Object.create(null);

    const fieldNodeMap: Record<string, FieldNode> = Object.create(null);

    for (const typeName in selectionSetsByField) {
        const type = schema.getType(typeName) as GraphQLObjectType;
        for (const fieldName in selectionSetsByField[typeName]) {
            for (const selectionSet of selectionSetsByField[typeName][fieldName]) {
                const { fields } = collectFields(
                    schema,
                    fragments,
                    variableValues,
                    type,
                    selectionSet,
                );

                for (const [, fieldNodes] of fields) {
                    for (const fieldNode of fieldNodes) {
                        const key = print(fieldNode);
                        if (fieldNodeMap[key] == null) {
                            fieldNodeMap[key] = fieldNode;
                            updateArrayMap(fieldNodesByField, typeName, fieldName, fieldNode);
                        } else {
                            updateArrayMap(
                                fieldNodesByField,
                                typeName,
                                fieldName,
                                fieldNodeMap[key],
                            );
                        }
                    }
                }
            }
        }
    }

    return stitchingInfo;
}

const updateSelectionSetMap = (
    map: Record<string, Record<string, SelectionSetNode[]>>,
    typeName: string,
    fieldName: string,
    selectionSet: SelectionSetNode,
    includeTypename?: boolean,
): void => {
    if (includeTypename) {
        const typenameSelectionSet = parseSelectionSet('{ __typename }', { noLocation: true });
        updateArrayMap(map, typeName, fieldName, selectionSet, typenameSelectionSet);
        return;
    }

    updateArrayMap(map, typeName, fieldName, selectionSet);
};

const updateArrayMap = <T>(
    map: Record<string, Record<string, T[]>>,
    typeName: string,
    fieldName: string,
    value: T,
    initialValue?: T,
): void => {
    if (map[typeName] == null) {
        const initialItems = initialValue === undefined ? [value] : [initialValue, value];
        map[typeName] = {
            [fieldName]: initialItems,
        };
    } else if (map[typeName][fieldName] == null) {
        const initialItems = initialValue === undefined ? [value] : [initialValue, value];
        map[typeName][fieldName] = initialItems;
    } else {
        map[typeName][fieldName].push(value);
    }
};

export const selectionSetContainsTopLevelField = (
    selectionSet: SelectionSetNode,
    fieldName: string,
) => {
    return selectionSet.selections.some(
        selection => selection.kind === Kind.FIELD && selection.name.value === fieldName,
    );
};

export const addStitchingInfo = <TContext = Record<string, any>>(
    stitchedSchema: GraphQLSchema,
    stitchingInfo: StitchingInfo<TContext>,
) => {
    stitchedSchema.extensions = {
        ...stitchedSchema.extensions,
        stitchingInfo,
    };
};
