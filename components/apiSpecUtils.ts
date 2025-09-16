
export const resolveRef = (ref: string, spec: any): any => {
    const path = ref.replace('#/', '').split('/');
    let current = spec;
    for (const p of path) {
        current = current?.[p];
        if (!current) return null;
    }
    return current;
};

export const generateExampleFromSchema = (schema: any, spec: any): any => {
    if (!schema) return null;
    if (schema.$ref) {
        return generateExampleFromSchema(resolveRef(schema.$ref, spec), spec);
    }
    if (schema.type === 'object') {
        const example: any = {};
        if (!schema.properties) return {};
        for (const [key, prop] of Object.entries(schema.properties as any)) {
            example[key] = generateExampleFromSchema(prop, spec);
        }
        return example;
    }
    if (schema.type === 'array') {
        const itemsExample = generateExampleFromSchema(schema.items, spec);
        return itemsExample ? [itemsExample] : [];
    }
    if (schema.enum) {
        return schema.enum[0];
    }
    if (schema.example) {
        return schema.example;
    }
    if (schema.format === 'email') return 'user@example.com';
    if (schema.type === 'string') return 'string';
    if (schema.type === 'boolean') return true;
    if (schema.type === 'number' || schema.type === 'integer') return 123;
    return null;
};
