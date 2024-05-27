const extendClass = function (baseClass, config) {
    const newClass = class extends baseClass {};
    Object.assign(newClass.prototype, config);
    return newClass;
};

class BusinessBase {
    static businessObject = null;

    async list({ start = 0, limit = 50, sort = {}, filter = {} }) {
        let query = this.Schema.find(filter)
            .sort(sort)
            .skip(start)
            .limit(limit);
        if (
            this.populate &&
            Array.isArray(this.populate) &&
            this.populate.length > 0
        ) {
            this.populate.forEach((field) => {
                query = query.populate(field);
            });
        }

        return query.exec();
    }

    async saveOrUpdate({ data }) {
        try {
            const { _id, ...updateData } = data;
            let result;
            if (_id) {
                result = await this.Schema.findByIdAndUpdate(_id, updateData, {
                    new: true,
                    upsert: true,
                }).exec();
            } else {
                const newDocument = new this.Schema(data);
                result = await newDocument.save();
            }
            return result;
        } catch (error) {
            console.error("Error saving or updating data in MongoDB:", error);
            throw error;
        }
    }

    async delete(id) {
        try {
            return this.Schema.findByIdAndDelete(id).exec();
        } catch (err) {
            console.error(err);
        }
    }

    async load(id) {
        try {
            return this.Schema.findOne(id).exec();
        } catch (err) {
            console.error(err);
        }
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
