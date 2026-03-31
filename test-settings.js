const { getSettingByKey } = require("./dist/modules/settings/settings.service");

async function test() {
  const key = await getSettingByKey("tavily.api_key");
  console.log("API Key:", key ? key.value : "null");
  const enabled = await getSettingByKey("tavily.enabled");
  console.log("Enabled:", enabled ? enabled.value : "null");
}

test();
