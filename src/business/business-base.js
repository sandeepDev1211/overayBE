import logger from "../utils/logger.js";

const extendClass = function (baseClass, config) {
    const newClass = class extends baseClass {};
    Object.assign(newClass.prototype, config);
    return newClass;
};

class BusinessBase {
    static businessObject = null;

    /**
     * The function `list` retrieves a list of documents from a database based on specified parameters
     * such as start, limit, sort, and filter.
     * @returns The `list` function is returning the result of executing the query built using the
     * provided `start`, `limit`, `sort`, and `filter` parameters. If there are any fields specified
     * for population, those fields will also be populated in the query result before it is executed.
     */
    async list({ start = 0, limit = 50, sort = {}, filter = {} }) {
        try {
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
            const result = await query.exec();
            return result;
        } catch (error) {
            logger.error(error);
            return { error: error.toString() };
        }
    }

    /**
     * The function `saveOrUpdate` asynchronously saves or updates data in MongoDB based on the
     * presence of an `_id` field in the input data.
     * @returns The `saveOrUpdate` function returns the result of either updating an existing document
     * in MongoDB or saving a new document. The result will be the updated document if an existing
     * document was updated, or the newly saved document if a new document was created.
     */
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
            logger.error(error);
            return { error: error.toString() };
        }
    }

    /**
     * The function `delete` is an asynchronous function that attempts to delete a document from a
     * MongoDB collection using the provided `id`, and logs any errors encountered.
     * @param id - The `id` parameter in the `delete` function is the unique identifier of the document
     * that you want to delete from the database. It is used to locate and remove the specific document
     * based on its ID.
     * @returns The `delete` method is returning a promise that resolves to the result of the
     * `findByIdAndDelete` operation on the `Schema` with the specified `id`.
     */
    async delete(id) {
        try {
            return this.Schema.findByIdAndDelete(id).exec();
        } catch (error) {
            logger.error(error);
            return { error: error.toString() };
        }
    }

    /**
     * The function `load` asynchronously loads a document from a database using the provided `id` and
     * returns a promise that resolves to the document.
     * @param id - The `id` parameter is the unique identifier used to query and load a specific
     * document from the database using the Mongoose `findOne` method.
     * @returns The `load` function is returning a promise that resolves to the result of
     * `this.Schema.findOne(id).exec()`.
     */
    async load(id) {
        try {
            let query = this.Schema.findById(id);
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
        } catch (error) {
            logger.error(error);
            return { error: error.toString() };
        }
    }
}

/* The `classMap` object is a utility object that helps manage and store classes in a mapping
structure.*/
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
