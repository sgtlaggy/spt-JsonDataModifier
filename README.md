# Json Data Modifier

This is mainly to suit my own setup because I symlink game and SPT files into game folders instead of having 40GB taken by each install.

This will let you edit config values without touching the server's own configs.

In `config/config.json`, the keys take the name of the json files in `SPT_Data/Server/configs`, so a key might be `inraid` or `http`. The values of those keys should be objects further mapping values in those configs to new values.

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
