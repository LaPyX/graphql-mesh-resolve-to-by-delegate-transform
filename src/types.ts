import { type Kind } from 'graphql';

export interface ResolveToByCondition {
    typeName: string;
    fieldName: string;
    fieldNodeType: Kind;
    resolvers: ResolveToByConditionResolver[];
}

export interface ResolveToByConditionResolver {
    args: ResolveToByConditionResolverArgs;
    options: ResolveToByConditionResolverOptions;
}

export interface ResolveToByConditionResolverArgs {
    condition?: string;
    requiredSelectionSet?: string;
    sourceName: string;
    sourceTypeName: string;
    sourceFieldName: string;
    sourceSelectionSet?: string;
    sourceArgs?: any;
    keyField?: string;
    keysArg?: string;
    pubsubTopic?: string;
    additionalArgs?: any;
    result?: any;
    resultType?: string;
    filterBy?: string;
    orderByPath?: string;
    orderByDirection?: ResolveToByConditionDirection;
    uniqueByPath?: string;
    hoistPath?: string;
    mergeBy?: string;
    targetTypeName: string;
    targetFieldName: string;
    targetFieldNodeType: Kind;
}

export enum ResolveToByConditionDirection {
    Asc = 'asc',
    Desc = 'desc',
}

export interface ResolveToByConditionResolverOptions {
    valuesFromResults?: any;
    selectionSet?: any;
}
