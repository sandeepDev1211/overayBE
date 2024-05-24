const extendClass = function (baseClass, config) {
    const newClass = class extends baseClass {};
    Object.assign(newClass.prototype, config);
    return newClass;
};

class BusinessBase {
    static businessObject = null;

    async list({ start = 0, limit = 50, sort = {}, filter = {} }) {
        return this.Schema.find(filter)
            .sort(sort)
            .skip(start)
            .limit(limit)
            .exec();
    }
}

const classMap = {
    map: new Map(),
    baseTypes: {
        default: BusinessBase,
    },
    register: function (name, configOrClass) {
        const { baseTypes } = this;
        if (configOrClass.prototype instanceof BusinessBase) {
            this.map.set(name.toUpperCase(), configOrClass);
        } else {
            const { baseType = "default" } = configOrClass;
            const DerivedType = extendClass(baseTypes[baseType], {
                ...configOrClass,
            });
            this.map.set(name.toUpperCase(), DerivedType);
        }
    },
    get: function (name) {
        return this.map.get(name.toUpperCase());
    },
};

export { BusinessBase, classMap };

export default BusinessBase;
