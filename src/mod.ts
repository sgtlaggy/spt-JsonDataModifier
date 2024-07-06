import { DependencyContainer } from "tsyringe";

import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ConfigServer } from "@spt/servers/ConfigServer";

import CONFIG from "../config/config.json";


function isValue(obj: any): boolean {
    return ["string", "number", "boolean"].includes(typeof obj) || Array.isArray(obj);
}


class Mod implements IPostDBLoadMod {
    protected logger: ILogger;

    protected setValueRecursive(obj: Record<string, any>, key: string, val: any, chain?: string[]) {
        chain = chain || [];
        chain.push(key);

        if (isValue(val)) {
            this.logger.info(`[ConfigReplacer] Setting ${chain.join(".")} to ${JSON.stringify(val)}`);
            obj[key] = val;
        } else {
            for (const [k, v] of Object.entries(val)) {
                this.setValueRecursive(obj[key], k, v, chain)
            }
        }
    }
    public postDBLoad(container: DependencyContainer): void {
        this.logger = container.resolve<ILogger>("WinstonLogger");
        const configServer = container.resolve<ConfigServer>("ConfigServer");

        const config: Record<string, any> = {};
        for (const type of Object.values(ConfigTypes)) {
            config[type.slice(4)] = configServer.getConfigByString(type);
        }
        for (const [category, settings] of Object.entries(CONFIG)) {
            this.setValueRecursive(config, category, settings);
        }
    }
}

export const mod = new Mod();
