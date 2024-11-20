import { DependencyContainer } from "tsyringe";

import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { DatabaseService } from "@spt/services/DatabaseService";
import { JsonUtil } from "@spt/utils/JsonUtil";

import path from "node:path";
import fs from "node:fs";


function isValue(obj: any): boolean {
    return ["string", "number", "boolean"].includes(typeof obj) || Array.isArray(obj);
}

class Mod implements IPostDBLoadMod {
    protected logger: ILogger;
    protected jsonUtil: JsonUtil;

    // This will set values nested within an object.
    // If the value is "simple", it will be set as-is.
    // If the value is an object, it will be created if it doesn't exist or
    // its items will be recursively set.
    // If the value is null, the key will be deleted.
    protected setValueRecursive(obj: Record<string, any>, key: string, val: any, chain?: string[]) {
        chain = chain?.slice() || [];
        chain.push(key);
        const entry = chain.join(".");
        const current = obj[key];
        const oldType = typeof current;
        const newType = typeof val;

        if (val === null) {
            if (current === undefined) {
                this.logger.warning(`[JsonDataModifier] Deleting ${entry}, but it was undefined`);
            } else {
                this.logger.warning(`[JsonDataModifier] Deleting ${entry}`);
            }

            if (Array.isArray(obj)) {
                obj.splice(parseInt(key), 1);
            } else {
                delete obj[key];
            }
            return;
        } else if (current === undefined) {
            this.logger.warning(`[JsonDataModifier] Creating ${entry}`);

            if ((typeof val) === "object") {
                obj[key] = val;
                return;
            }
        } else if (oldType !== newType) {
            this.logger.warning(`[JsonDataModifier] Changing type of ${entry} from ${oldType} to ${newType}`);
        }

        if (isValue(val)) {
            this.logger.info(`[JsonDataModifier] Setting ${entry} to ${JSON.stringify(val)}`);
            obj[key] = val;
        } else {
            for (const [k, v] of Object.entries(val)) {
                this.setValueRecursive(obj[key], k, v, chain);
            }
        }
    }

    // Get nested values from an object.
    // The following are equivalent:
    // getValueRecursive(obj, ["foo", "bar", "baz"])
    // obj["foo"]["bar"]["baz"]
    protected getValueRecursive(obj: object, keys: string[]): any {
        if (keys.length === 0 || obj === undefined) {
            return obj;
        }

        const next = obj[keys[0]];
        return this.getValueRecursive(next, keys.slice(1));
    }

    // Using `path` and `fs` instead of SPT's `VFS` here because it allows recursive
    // searching, iteration without generating a full list, and already having file
    // path and name split, which would require `path` anyway.
    protected applyJsonModifications(dir: string, baseObj: object) {
        const dirName = path.basename(dir);
        const dirents = fs.readdirSync(dir, {recursive: true, withFileTypes: true});
        for (const dirent of dirents) {
            const ext = path.extname(dirent.name).toLowerCase();
            if (dirent.isDirectory() || dirent.name.startsWith("_") || !(/\.json[5c]?$/.test(ext))) {
                continue;
            }

            const fn = path.join(dirent.path, dirent.name);

            const location = path.relative(dir, dirent.path).split(path.sep);
            if (!location[0]) {
                location.splice(0, 1);
            }

            const obj = this.getValueRecursive(baseObj, location);

            const buffer = fs.readFileSync(fn, "utf8");
            let data: string;
            if (ext === ".json") {
                data = this.jsonUtil.deserialize(buffer);
            } else if (ext === ".json5") {
                data = this.jsonUtil.deserializeJson5(buffer);
            } else if (ext === ".jsonc") {
                data = this.jsonUtil.deserializeJsonC(buffer);
            } else { // this shouldn't happen, but just in case
                this.logger.warning(`[JsonDataModifier] Invalid extension: ${fn}`);
                return;
            }

            for (const [key, val] of Object.entries(data)) {
                this.setValueRecursive(obj, key, val, [dirName].concat(location));
            }
        }
    }

    public postDBLoad(container: DependencyContainer): void {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.jsonUtil = container.resolve<JsonUtil>("JsonUtil");

        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const databaseService = container.resolve<DatabaseService>("DatabaseService");
        const db = databaseService.getTables();

        const config: Record<string, any> = {};
        for (const type of Object.values(ConfigTypes)) {
            config[type.slice(4)] = configServer.getConfigByString(type);
        }

        const modDir = path.dirname(__dirname);
        this.applyJsonModifications(path.join(modDir, "configs"), config);
        this.applyJsonModifications(path.join(modDir, "database"), db);
    }
}

export const mod = new Mod();
