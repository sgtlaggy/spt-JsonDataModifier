# Json Data Modifier

This is mainly to suit my own setup because I symlink game and SPT files into game folders instead of having 40GB taken by each install.

This will let you edit config values without touching the server's own configs.

In `configs/configs.json` (filenames don't matter) the keys take the name of the json files in `SPT_Data/Server/configs`, so a key might be `inraid` or `http`. The values of those keys should be objects further mapping values in those configs to new values.

Example:

```json
{
    "inventory": {
        "newItemsMarkedFound": true
    },
    "core": {
        "allowProfileWipe": false,
        "fixes": {
            "removeModItemsFromProfile": true
        }
    }
}
```

The same functionality applies to database modifications through the `database` folder.

## Nested Folder Structure

Json files can also be nested within `configs` for a more modular, tree-style layout, each new folder replaces a key in the Json.

Using the `core` config section from above, you can use either of the following files:

`configs/configs.json` or `configs/profileFixes.json`, name doesn't matter

```json
{
    "core": {
        "allowProfileWipe": false,
        "fixes": {
            "removeModItemsFromProfile": true
        }
    }
}
```

`configs/core/profileFixes.json`

```json
{
    "allowProfileWipe": false,
    "fixes": {
        "removeModItemsFromProfile": true
    }
}
```

## Deleting Entries

Config and database entries can be deleted by setting its value to `null`.
The following example will remove Jaeger's dehydration quest and set the starting requirement of tehe next quest (Wounded Beast) to the previous (Thrifty).

```json
{
    "templates" : {
        "quests": {
            "5d25bfd086f77442734d3007": null,
            "5d25c81b86f77443e625dd71": {
                "conditions": {
                    "AvailableForStart": {
                        "0": {
                            "target": "5d25b6be86f77444001e1b89"
                        }
                    }
                }
            }
        }
    }
}
```

## Debugging

NOTE: Debugging dumps are made immediately after all changes applied by this mod. Mod load order could affect how true dumps are relative to in-game observations. You will likely need to load this mod last by using a load order editor or renaming it with `z` at the front of the folder name.

Specific sections of the config or database can be dumped to inspect their values at runtime.
Edit the `debug.json` file and add a dot-separated path to the data you want in the `dump` array. Each path should start with `configs` or `database`.
For example, the following `debug.json` will dump the settings for the Christmas event and Prapor's assort table.

```json
{
  "dump": [
    "configs.seasonalevents.events.1",
    "database.traders.54cb50c76803fa8b248b4571.assort"
  ]
}
```

This will create a `dumps` folder and a timestamped folder inside it. The timestamped folder will have a file for each path in the array.
