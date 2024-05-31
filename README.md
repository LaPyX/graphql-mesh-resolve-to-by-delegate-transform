# Resolve To By Delegate Transform for GraphQL Mesh

Resolve To By Delegate Transform - is a transformer for [GraphQL Mesh](https://graphql-mesh.com/) that adds a directive to enable the creation of relationships with pre- and post-conditions.

## Installation

Before you can use the Resolve To By Delegate Transform, you need to install it along with GraphQL Mesh if you haven't already done so. You can install these using npm or yarn.

```bash
npm install @dmamontov/graphql-mesh-resolve-to-by-delegate-transform
```

or

```bash
yarn add @dmamontov/graphql-mesh-resolve-to-by-delegate-transform
```

## Configuration

### Modifying tsconfig.json

To make TypeScript recognize the Resolve To By Delegate Transform, you need to add an alias in your tsconfig.json.

Add the following paths configuration under the compilerOptions in your tsconfig.json file:

```json
{
  "compilerOptions": {
    "paths": {
       "resolve-to-by-delegate": ["./node_modules/@dmamontov/graphql-mesh-resolve-to-by-delegate-transform"]
    }
  }
}
```

### Adding the Transform to GraphQL Mesh

You need to include the Resolve To By Delegate Transform in your GraphQL Mesh configuration file (usually .meshrc.yaml). Below is an example configuration that demonstrates how to use this transform:

```yaml
transforms:
  - resolveToByDelegate: true

additionalTypeDefs:
  - node_modules/@dmamontov/graphql-mesh-resolve-to-by-delegate-transform/esm/resolve-to-by-directive.graphql
```

## Conclusion

Remember, always test your configurations in a development environment before applying them in production to ensure that everything works as expected.