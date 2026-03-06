/**
 * PalWorldSettings.ini parser and serializer
 *
 * The INI file format:
 * [/Script/Pal.PalGameWorldSettings]
 * OptionSettings=(Key=Value,Key=Value,...)
 *
 * Value formats:
 *   - Quoted string:  Key="some text"
 *   - Unquoted enum:  Key=None  |  Key=All
 *   - Float number:   Key=1.000000
 *   - Integer number: Key=3000
 *   - Boolean:        Key=True  |  Key=False
 *   - Tuple:          Key=(A,B,C)
 */

export interface PalWorldSettings {
  [key: string]: string | number | boolean;
}

/**
 * iniFormat controls how a value is written back to the INI file:
 *   'quoted'   → Key="value"
 *   'unquoted' → Key=value             (enum identifiers: None, All, Text …)
 *   'float'    → Key=1.000000          (6 decimal places)
 *   'integer'  → Key=3000
 *   'tuple'    → Key=(Steam,Xbox,PS5)
 */
export type IniFormat = "quoted" | "unquoted" | "float" | "integer" | "tuple";

export type SettingsCategory =
  | "Server Settings"
  | "In-Game Settings"
  | "Advanced Settings";

export interface SettingSchema {
  type: "string" | "number" | "boolean";
  iniFormat?: IniFormat;
  label: string;
  category: SettingsCategory;
  description: string;
  default?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  inputType?: "textarea" | "password";
  difficultyHint?: "harder-easier";
}

export interface ValidationError {
  key: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Complete schema – every known PalWorldSettings.ini key
// Categories: "Server Settings" | "In-Game Settings" | "Advanced Settings"
// ---------------------------------------------------------------------------
export const SETTINGS_SCHEMA: Record<string, SettingSchema> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // SERVER SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  ServerName: {
    type: "string",
    iniFormat: "quoted",
    label: "Server Name",
    category: "Server Settings",
    description: "The name displayed in the server browser",
    default: "Default Palworld Server",
  },
  ServerDescription: {
    type: "string",
    iniFormat: "quoted",
    label: "Server Description",
    category: "Server Settings",
    description: "Server description shown to players",
    default: "",
    inputType: "textarea",
  },
  AdminPassword: {
    type: "string",
    iniFormat: "quoted",
    label: "Admin Password",
    category: "Server Settings",
    description: "Password for admin access",
    default: "",
    inputType: "password",
  },
  ServerPassword: {
    type: "string",
    iniFormat: "quoted",
    label: "Server Password",
    category: "Server Settings",
    description: "Password required to join the server",
    default: "",
    inputType: "password",
  },
  PublicIP: {
    type: "string",
    iniFormat: "quoted",
    label: "Public IP",
    category: "Server Settings",
    description: "Public IP address for the server",
    default: "",
  },
  PublicPort: {
    type: "number",
    iniFormat: "integer",
    label: "Public Port",
    category: "Server Settings",
    description: "Public port number",
    default: 8211,
    min: 1,
    max: 65535,
  },
  ServerPlayerMaxNum: {
    type: "number",
    iniFormat: "integer",
    label: "Server Player Max Num",
    category: "Server Settings",
    description: "Maximum number of players on the server",
    default: 32,
    min: 1,
    max: 32,
    step: 1,
  },
  CoopPlayerMaxNum: {
    type: "number",
    iniFormat: "integer",
    label: "Coop Player Max Num",
    category: "Server Settings",
    description: "Maximum number of co-op players",
    default: 4,
    min: 1,
    max: 32,
    step: 1,
  },
  bIsMultiplay: {
    type: "boolean",
    label: "Is Multiplay",
    category: "Server Settings",
    description: "Enable multiplayer mode",
    default: false,
  },
  Region: {
    type: "string",
    iniFormat: "quoted",
    label: "Region",
    category: "Server Settings",
    description: "Server region",
    default: "",
  },
  bUseAuth: {
    type: "boolean",
    label: "Use Auth",
    category: "Server Settings",
    description: "Enable authentication",
    default: true,
  },
  BanListURL: {
    type: "string",
    iniFormat: "quoted",
    label: "Ban List URL",
    category: "Server Settings",
    description: "URL for the ban list",
    default: "https://api.palworldgame.com/api/banlist.txt",
  },
  bShowPlayerList: {
    type: "boolean",
    label: "Show Player List",
    category: "Server Settings",
    description: "Show player list publicly",
    default: true,
  },
  AllowConnectPlatform: {
    type: "string",
    iniFormat: "unquoted",
    label: "Allow Connect Platform",
    category: "Server Settings",
    description: "Platform allowed to connect",
    default: "Steam",
    options: [
      { value: "Steam", label: "Steam" },
      { value: "Xbox", label: "Xbox" },
    ],
  },
  ChatPostLimitPerMinute: {
    type: "number",
    iniFormat: "integer",
    label: "Chat Post Limit Per Minute",
    category: "Server Settings",
    description: "Maximum chat messages per minute",
    default: 10,
    min: 0,
    max: 999,
    step: 1,
  },
  CrossplayPlatforms: {
    type: "string",
    iniFormat: "tuple",
    label: "Crossplay Platforms",
    category: "Server Settings",
    description: "Allowed crossplay platforms, e.g. (Steam,Xbox,PS5,Mac)",
    default: "(Steam,Xbox,PS5,Mac)",
  },
  bIsUseBackupSaveData: {
    type: "boolean",
    label: "Use Backup Save Data",
    category: "Server Settings",
    description: "Enable backup save data",
    default: true,
  },
  LogFormatType: {
    type: "string",
    iniFormat: "unquoted",
    label: "Log Format Type",
    category: "Server Settings",
    description: "Log format type",
    default: "Text",
    options: [
      { value: "Text", label: "Text" },
      { value: "Json", label: "Json" },
    ],
  },
  AutoSaveSpan: {
    type: "number",
    iniFormat: "float",
    label: "Auto Save Span",
    category: "Server Settings",
    description: "Auto-save interval in minutes",
    default: 30,
    min: 0,
    max: 3600,
    step: 1,
  },
  bIsShowJoinLeftMessage: {
    type: "boolean",
    label: "Show Join/Left Message",
    category: "Server Settings",
    description: "Show player join/leave messages",
    default: true,
  },
  SupplyDropSpan: {
    type: "number",
    iniFormat: "integer",
    label: "Supply Drop Span",
    category: "Server Settings",
    description: "Supply drop interval in minutes",
    default: 180,
    min: 0,
    max: 9999,
    step: 1,
  },
  RCONEnabled: {
    type: "boolean",
    label: "RCON Enabled",
    category: "Server Settings",
    description: "Enable RCON remote console",
    default: false,
  },
  RCONPort: {
    type: "number",
    iniFormat: "integer",
    label: "RCON Port",
    category: "Server Settings",
    description: "RCON port number",
    default: 25575,
    min: 1,
    max: 65535,
  },
  RESTAPIEnabled: {
    type: "boolean",
    label: "REST API Enabled",
    category: "Server Settings",
    description: "Enable REST API",
    default: true,
  },
  RESTAPIPort: {
    type: "number",
    iniFormat: "integer",
    label: "REST API Port",
    category: "Server Settings",
    description: "REST API port number",
    default: 8212,
    min: 1,
    max: 65535,
  },
  bAllowClientMod: {
    type: "boolean",
    label: "Allow Client Mod",
    category: "Server Settings",
    description: "Allow client-side mods",
    default: false,
  },
  ServerReplicatePawnCullDistance: {
    type: "number",
    iniFormat: "float",
    label: "Pawn Cull Distance",
    category: "Server Settings",
    description: "Server pawn replication cull distance",
    default: 15000,
    min: 0,
    max: 100000,
    step: 100,
  },
  bAllowGlobalPalboxExport: {
    type: "boolean",
    label: "Allow Global Palbox Export",
    category: "Server Settings",
    description: "Allow global Palbox export",
    default: false,
  },
  bAllowGlobalPalboxImport: {
    type: "boolean",
    label: "Allow Global Palbox Import",
    category: "Server Settings",
    description: "Allow global Palbox import",
    default: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // IN-GAME SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  Difficulty: {
    type: "string",
    iniFormat: "unquoted",
    label: "Difficulty",
    category: "In-Game Settings",
    description: "Game difficulty level",
    default: "None",
    options: [
      { value: "None", label: "None (Custom)" },
      { value: "Normal", label: "Normal" },
      { value: "Difficult", label: "Difficult" },
    ],
  },
  DayTimeSpeedRate: {
    type: "number",
    iniFormat: "float",
    label: "Day Time Speed Rate",
    category: "In-Game Settings",
    description: "Day time speed multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  NightTimeSpeedRate: {
    type: "number",
    iniFormat: "float",
    label: "Night Time Speed Rate",
    category: "In-Game Settings",
    description: "Night time speed multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  ExpRate: {
    type: "number",
    iniFormat: "float",
    label: "Exp Rate",
    category: "In-Game Settings",
    description: "Experience gain rate multiplier",
    default: 1,
    min: 0.1,
    max: 20,
    step: 0.1,
    difficultyHint: "harder-easier",
  },
  PalCaptureRate: {
    type: "number",
    iniFormat: "float",
    label: "Pal Capture Rate",
    category: "In-Game Settings",
    description: "Pal capture success rate multiplier",
    default: 1,
    min: 0.5,
    max: 2,
    step: 0.01,
    difficultyHint: "harder-easier",
  },
  PalSpawnNumRate: {
    type: "number",
    iniFormat: "float",
    label: "Pal Spawn Number Rate",
    category: "In-Game Settings",
    description: "Pal spawn count multiplier",
    default: 1,
    min: 0.5,
    max: 3,
    step: 0.1,
  },
  PalDamageRateAttack: {
    type: "number",
    iniFormat: "float",
    label: "Pal Damage Rate Attack",
    category: "In-Game Settings",
    description: "Pal attack damage multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  PalDamageRateDefense: {
    type: "number",
    iniFormat: "float",
    label: "Pal Damage Rate Defense",
    category: "In-Game Settings",
    description: "Pal defense damage multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  PlayerDamageRateAttack: {
    type: "number",
    iniFormat: "float",
    label: "Player Damage Rate Attack",
    category: "In-Game Settings",
    description: "Player attack damage multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  PlayerDamageRateDefense: {
    type: "number",
    iniFormat: "float",
    label: "Player Damage Rate Defense",
    category: "In-Game Settings",
    description: "Player defense damage multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  PlayerStomachDecreaceRate: {
    type: "number",
    iniFormat: "float",
    label: "Player Stomach Decrease Rate",
    category: "In-Game Settings",
    description: "Player hunger depletion rate",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  PlayerStaminaDecreaceRate: {
    type: "number",
    iniFormat: "float",
    label: "Player Stamina Decrease Rate",
    category: "In-Game Settings",
    description: "Player stamina depletion rate",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  PlayerAutoHPRegeneRate: {
    type: "number",
    iniFormat: "float",
    label: "Player Auto HP Regen Rate",
    category: "In-Game Settings",
    description: "Player auto HP regeneration multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  PlayerAutoHpRegeneRateInSleep: {
    type: "number",
    iniFormat: "float",
    label: "Player Auto HP Regen (Sleep)",
    category: "In-Game Settings",
    description: "Player HP regen while sleeping multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  PalStomachDecreaceRate: {
    type: "number",
    iniFormat: "float",
    label: "Pal Stomach Decrease Rate",
    category: "In-Game Settings",
    description: "Pal hunger depletion rate",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  PalStaminaDecreaceRate: {
    type: "number",
    iniFormat: "float",
    label: "Pal Stamina Decrease Rate",
    category: "In-Game Settings",
    description: "Pal stamina depletion rate",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  PalAutoHPRegeneRate: {
    type: "number",
    iniFormat: "float",
    label: "Pal Auto HP Regen Rate",
    category: "In-Game Settings",
    description: "Pal auto HP regeneration multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  PalAutoHpRegeneRateInSleep: {
    type: "number",
    iniFormat: "float",
    label: "Pal Auto HP Regen (Sleep)",
    category: "In-Game Settings",
    description: "Pal HP regen while sleeping multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  PalEggDefaultHatchingTime: {
    type: "number",
    iniFormat: "float",
    label: "Pal Egg Hatching Time",
    category: "In-Game Settings",
    description: "Default egg hatching time in hours",
    default: 72,
    min: 0,
    max: 240,
    step: 1,
  },
  CollectionDropRate: {
    type: "number",
    iniFormat: "float",
    label: "Collection Drop Rate",
    category: "In-Game Settings",
    description: "Collection drop rate multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  CollectionObjectHpRate: {
    type: "number",
    iniFormat: "float",
    label: "Collection Object HP Rate",
    category: "In-Game Settings",
    description: "Collection object HP multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  CollectionObjectRespawnSpeedRate: {
    type: "number",
    iniFormat: "float",
    label: "Collection Respawn Speed Rate",
    category: "In-Game Settings",
    description: "Collection object respawn speed multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  EnemyDropItemRate: {
    type: "number",
    iniFormat: "float",
    label: "Enemy Drop Item Rate",
    category: "In-Game Settings",
    description: "Enemy item drop rate multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  DeathPenalty: {
    type: "string",
    iniFormat: "unquoted",
    label: "Death Penalty",
    category: "In-Game Settings",
    description: "What players lose on death",
    default: "None",
    options: [
      { value: "None", label: "None" },
      { value: "Item", label: "Items" },
      { value: "ItemAndEquipment", label: "Items & Equipment" },
      { value: "All", label: "All" },
    ],
  },
  WorkSpeedRate: {
    type: "number",
    iniFormat: "float",
    label: "Work Speed Rate",
    category: "In-Game Settings",
    description: "Work speed multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
    difficultyHint: "harder-easier",
  },
  ItemWeightRate: {
    type: "number",
    iniFormat: "float",
    label: "Item Weight Rate",
    category: "In-Game Settings",
    description: "Item weight multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  EquipmentDurabilityDamageRate: {
    type: "number",
    iniFormat: "float",
    label: "Equipment Durability Damage Rate",
    category: "In-Game Settings",
    description: "Equipment durability damage multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  BuildObjectHpRate: {
    type: "number",
    iniFormat: "float",
    label: "Build Object HP Rate",
    category: "In-Game Settings",
    description: "Building HP multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  BuildObjectDamageRate: {
    type: "number",
    iniFormat: "float",
    label: "Build Object Damage Rate",
    category: "In-Game Settings",
    description: "Building damage multiplier",
    default: 1,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  BuildObjectDeteriorationDamageRate: {
    type: "number",
    iniFormat: "float",
    label: "Build Deterioration Damage Rate",
    category: "In-Game Settings",
    description: "Building deterioration damage multiplier",
    default: 1,
    min: 0,
    max: 5,
    step: 0.1,
  },
  RandomizerType: {
    type: "string",
    iniFormat: "unquoted",
    label: "Randomizer Type",
    category: "In-Game Settings",
    description: "Randomizer mode type",
    default: "None",
    options: [
      { value: "None", label: "None" },
      { value: "Full", label: "Full" },
    ],
  },
  RandomizerSeed: {
    type: "string",
    iniFormat: "quoted",
    label: "Randomizer Seed",
    category: "In-Game Settings",
    description: "Seed for the randomizer",
    default: "",
  },
  bIsRandomizerPalLevelRandom: {
    type: "boolean",
    label: "Randomizer Pal Level Random",
    category: "In-Game Settings",
    description: "Randomize Pal levels in randomizer mode",
    default: false,
  },
  bEnableInvaderEnemy: {
    type: "boolean",
    label: "Enable Invader Enemy",
    category: "In-Game Settings",
    description: "Enable enemy raids on bases",
    default: true,
  },
  EnablePredatorBossPal: {
    type: "boolean",
    label: "Enable Predator Boss Pal",
    category: "In-Game Settings",
    description: "Enable predator boss Pals in the world",
    default: true,
  },
  ItemContainerForceMarkDirtyInterval: {
    type: "number",
    iniFormat: "float",
    label: "Item Container Dirty Interval",
    category: "In-Game Settings",
    description: "Item container force mark dirty interval",
    default: 1,
    min: 0,
    max: 100,
    step: 0.5,
  },
  ItemCorruptionMultiplier: {
    type: "number",
    iniFormat: "float",
    label: "Item Corruption Multiplier",
    category: "In-Game Settings",
    description: "Item corruption rate multiplier",
    default: 1,
    min: 0,
    max: 5,
    step: 0.1,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVANCED SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  bEnablePlayerToPlayerDamage: {
    type: "boolean",
    label: "Enable Player To Player Damage",
    category: "Advanced Settings",
    description: "Allow players to damage other players",
    default: false,
  },
  bEnableFriendlyFire: {
    type: "boolean",
    label: "Enable Friendly Fire",
    category: "Advanced Settings",
    description: "Allow friendly fire damage",
    default: false,
  },
  bActiveUNKO: {
    type: "boolean",
    label: "Active UNKO (Pal will poop)",
    category: "Advanced Settings",
    description: "Enable Pal poop feature",
    default: false,
  },
  bEnableAimAssistPad: {
    type: "boolean",
    label: "Enable Aim Assist Controller",
    category: "Advanced Settings",
    description: "Enable aim assist for game controllers",
    default: true,
  },
  bEnableAimAssistKeyboard: {
    type: "boolean",
    label: "Enable Aim Assist Keyboard",
    category: "Advanced Settings",
    description: "Enable aim assist for keyboard/mouse",
    default: false,
  },
  bEnableNonLoginPenalty: {
    type: "boolean",
    label: "Enable Non-Login Penalty",
    category: "Advanced Settings",
    description: "Penalize players who don't log in regularly",
    default: true,
  },
  bEnableFastTravel: {
    type: "boolean",
    label: "Enable Fast Travel",
    category: "Advanced Settings",
    description: "Allow fast travel teleportation",
    default: true,
  },
  bEnableFastTravelOnlyBaseCamp: {
    type: "boolean",
    label: "Fast Travel Only Base Camp",
    category: "Advanced Settings",
    description: "Restrict fast travel to base camps only",
    default: false,
  },
  bIsStartLocationSelectByMap: {
    type: "boolean",
    label: "Start Location Select By Map",
    category: "Advanced Settings",
    description: "Allow selecting start location on the map",
    default: true,
  },
  bExistPlayerAfterLogout: {
    type: "boolean",
    label: "Player Exists After Logout",
    category: "Advanced Settings",
    description: "Player character remains in world after logout",
    default: false,
  },
  bBuildAreaLimit: {
    type: "boolean",
    label: "Build Area Limit",
    category: "Advanced Settings",
    description: "Limit building to designated areas",
    default: false,
  },
  bHardcore: {
    type: "boolean",
    label: "Hardcore Mode",
    category: "Advanced Settings",
    description: "Enable hardcore mode (permanent consequences)",
    default: false,
  },
  bPalLost: {
    type: "boolean",
    label: "Pal Lost On Death",
    category: "Advanced Settings",
    description: "Lose Pals permanently on death",
    default: false,
  },
  bCharacterRecreateInHardcore: {
    type: "boolean",
    label: "Character Recreate In Hardcore",
    category: "Advanced Settings",
    description: "Must recreate character on death in hardcore",
    default: false,
  },
  bIsPvP: {
    type: "boolean",
    label: "Is PvP",
    category: "Advanced Settings",
    description: "Enable PvP mode globally",
    default: false,
  },
  DropItemMaxNum: {
    type: "number",
    iniFormat: "integer",
    label: "Drop Item Max Num",
    category: "Advanced Settings",
    description: "Maximum number of dropped items in the world",
    default: 3000,
    min: 0,
    max: 10000,
    step: 100,
  },
  DropItemMaxNum_UNKO: {
    type: "number",
    iniFormat: "integer",
    label: "Pal Poop Drop Max Num (UNKO)",
    category: "Advanced Settings",
    description: "Maximum number of Pal poop items",
    default: 100,
    min: 0,
    max: 1000,
    step: 10,
  },
  DropItemAliveMaxHours: {
    type: "number",
    iniFormat: "float",
    label: "Drop Item Alive Max Hours",
    category: "Advanced Settings",
    description: "Hours before dropped items despawn",
    default: 1,
    min: 0,
    max: 24,
    step: 0.5,
  },
  BaseCampMaxNum: {
    type: "number",
    iniFormat: "integer",
    label: "Base Camp Max Num",
    category: "Advanced Settings",
    description: "Maximum number of base camps",
    default: 128,
    min: 1,
    max: 500,
    step: 1,
  },
  BaseCampWorkerMaxNum: {
    type: "number",
    iniFormat: "integer",
    label: "Base Camp Worker Max Num",
    category: "Advanced Settings",
    description: "Maximum workers per base camp",
    default: 15,
    min: 1,
    max: 20,
    step: 1,
  },
  BaseCampMaxNumInGuild: {
    type: "number",
    iniFormat: "integer",
    label: "Base Camp Max Num In Guild",
    category: "Advanced Settings",
    description: "Maximum base camps per guild",
    default: 4,
    min: 1,
    max: 10,
    step: 1,
  },
  MaxBuildingLimitNum: {
    type: "number",
    iniFormat: "integer",
    label: "Max Building Limit Num",
    category: "Advanced Settings",
    description: "Maximum building limit (0 = unlimited)",
    default: 0,
    min: 0,
    max: 100000,
    step: 100,
  },
  bAutoResetGuildNoOnlinePlayers: {
    type: "boolean",
    label: "Auto Reset Guild No Online Players",
    category: "Advanced Settings",
    description: "Auto-reset guild when no players are online",
    default: false,
  },
  AutoResetGuildTimeNoOnlinePlayers: {
    type: "number",
    iniFormat: "float",
    label: "Auto Reset Guild Time No Online Players",
    category: "Advanced Settings",
    description: "Hours before auto-resetting an empty guild",
    default: 72,
    min: 0,
    max: 720,
    step: 1,
  },
  GuildPlayerMaxNum: {
    type: "number",
    iniFormat: "integer",
    label: "Guild Player Max Num",
    category: "Advanced Settings",
    description: "Maximum players per guild",
    default: 20,
    min: 1,
    max: 100,
    step: 1,
  },
  GuildRejoinCooldownMinutes: {
    type: "number",
    iniFormat: "integer",
    label: "Guild Rejoin Cooldown",
    category: "Advanced Settings",
    description: "Minutes before a player can rejoin a guild",
    default: 5,
    min: 0,
    max: 1440,
    step: 1,
  },
  bCanPickupOtherGuildDeathPenaltyDrop: {
    type: "boolean",
    label: "Pickup Other Guild Death Drop",
    category: "Advanced Settings",
    description: "Allow picking up items from other guild death drops",
    default: false,
  },
  bEnableDefenseOtherGuildPlayer: {
    type: "boolean",
    label: "Enable Defense Other Guild",
    category: "Advanced Settings",
    description: "Enable defense against other guild players",
    default: false,
  },
  bInvisibleOtherGuildBaseCampAreaFX: {
    type: "boolean",
    label: "Invisible Other Guild Base FX",
    category: "Advanced Settings",
    description: "Hide other guild base camp area effects",
    default: false,
  },
  bDisplayPvPItemNumOnWorldMap_BaseCamp: {
    type: "boolean",
    label: "Display PvP Items On Map (Base)",
    category: "Advanced Settings",
    description: "Show PvP item count on world map for bases",
    default: false,
  },
  bDisplayPvPItemNumOnWorldMap_Player: {
    type: "boolean",
    label: "Display PvP Items On Map (Player)",
    category: "Advanced Settings",
    description: "Show PvP item count on world map for players",
    default: false,
  },
  AdditionalDropItemWhenPlayerKillingInPvPMode: {
    type: "string",
    iniFormat: "quoted",
    label: "PvP Kill Additional Drop Item",
    category: "Advanced Settings",
    description: "Item dropped when killing a player in PvP",
    default: "",
  },
  AdditionalDropItemNumWhenPlayerKillingInPvPMode: {
    type: "number",
    iniFormat: "integer",
    label: "PvP Kill Additional Drop Num",
    category: "Advanced Settings",
    description: "Number of items dropped on PvP kill",
    default: 0,
    min: 0,
    max: 999,
    step: 1,
  },
  bAdditionalDropItemWhenPlayerKillingInPvPMode: {
    type: "boolean",
    label: "Enable PvP Kill Additional Drop",
    category: "Advanced Settings",
    description: "Enable additional item drops on PvP kill",
    default: false,
  },
  bAllowEnhanceStat_Health: {
    type: "boolean",
    label: "Allow Enhance Health",
    category: "Advanced Settings",
    description: "Allow players to enhance health stat",
    default: true,
  },
  bAllowEnhanceStat_Attack: {
    type: "boolean",
    label: "Allow Enhance Attack",
    category: "Advanced Settings",
    description: "Allow players to enhance attack stat",
    default: true,
  },
  bAllowEnhanceStat_Stamina: {
    type: "boolean",
    label: "Allow Enhance Stamina",
    category: "Advanced Settings",
    description: "Allow players to enhance stamina stat",
    default: true,
  },
  bAllowEnhanceStat_Weight: {
    type: "boolean",
    label: "Allow Enhance Weight",
    category: "Advanced Settings",
    description: "Allow players to enhance weight stat",
    default: true,
  },
  bAllowEnhanceStat_WorkSpeed: {
    type: "boolean",
    label: "Allow Enhance Work Speed",
    category: "Advanced Settings",
    description: "Allow players to enhance work speed stat",
    default: true,
  },
  BlockRespawnTime: {
    type: "number",
    iniFormat: "float",
    label: "Block Respawn Time",
    category: "Advanced Settings",
    description: "Block respawn time in seconds",
    default: 10,
    min: 0,
    max: 3600,
    step: 1,
  },
  RespawnPenaltyDurationThreshold: {
    type: "number",
    iniFormat: "float",
    label: "Respawn Penalty Duration Threshold",
    category: "Advanced Settings",
    description: "Threshold for respawn penalty duration",
    default: 10,
    min: 0,
    max: 3600,
    step: 1,
  },
  RespawnPenaltyTimeScale: {
    type: "number",
    iniFormat: "float",
    label: "Respawn Penalty Time Scale",
    category: "Advanced Settings",
    description: "Scale factor for respawn penalty time",
    default: 1,
    min: 0,
    max: 10,
    step: 0.1,
  },
  DenyTechnologyList: {
    type: "string",
    iniFormat: "unquoted",
    label: "Deny Technology List",
    category: "Advanced Settings",
    description: "Comma-separated list of denied technologies",
    default: "",
  },
};

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse PalWorldSettings.ini content into a key-value object.
 *
 * Uses depth-counting to correctly handle nested parentheses
 * (e.g. CrossplayPlatforms=(Steam,Xbox,PS5,Mac) inside OptionSettings=(...)).
 */
export function parseSettings(content: string): PalWorldSettings {
  const settings: PalWorldSettings = {};

  // ── 1. Locate OptionSettings=( using indexOf + depth counting ──
  const anchor = content.indexOf("OptionSettings=");
  if (anchor === -1) return settings;

  // Find opening paren, skipping optional whitespace
  let parenStart = -1;
  for (let j = anchor + "OptionSettings=".length; j < content.length; j++) {
    const ch = content[j];
    if (ch === " " || ch === "\t") continue;
    if (ch === "(") {
      parenStart = j;
      break;
    }
    break; // non-whitespace, non-paren → malformed
  }
  if (parenStart === -1) return settings;

  // Depth-count to the matching closing paren
  let depth = 0;
  let parenEnd = -1;
  for (let j = parenStart; j < content.length; j++) {
    if (content[j] === "(") depth++;
    else if (content[j] === ")") {
      depth--;
      if (depth === 0) {
        parenEnd = j;
        break;
      }
    }
  }
  if (parenEnd === -1) return settings;

  // The option string is everything between the outer parens
  const optionStr = content.substring(parenStart + 1, parenEnd);

  // ── 2. Parse key=value pairs ──
  let i = 0;

  while (i < optionStr.length) {
    // Skip separators (commas, whitespace, newlines)
    while (
      i < optionStr.length &&
      (optionStr[i] === "," ||
        optionStr[i] === " " ||
        optionStr[i] === "\n" ||
        optionStr[i] === "\r" ||
        optionStr[i] === "\t")
    ) {
      i++;
    }
    if (i >= optionStr.length) break;

    // ── Read key ──
    const keyStart = i;
    while (i < optionStr.length && optionStr[i] !== "=") i++;
    const key = optionStr.substring(keyStart, i).trim();
    i++; // skip '='
    if (!key) break;

    // ── Read value ──
    let value: string;

    if (i >= optionStr.length) {
      value = "";
    } else if (optionStr[i] === '"') {
      // Quoted string – read to closing "
      i++; // skip opening "
      const vs = i;
      while (i < optionStr.length && optionStr[i] !== '"') i++;
      value = optionStr.substring(vs, i);
      if (i < optionStr.length) i++; // skip closing "
    } else if (optionStr[i] === "(") {
      // Parenthesized tuple – depth-count to matching )
      const vs = i;
      let d = 0;
      while (i < optionStr.length) {
        if (optionStr[i] === "(") d++;
        else if (optionStr[i] === ")") {
          d--;
          if (d === 0) {
            i++;
            break;
          }
        }
        i++;
      }
      value = optionStr.substring(vs, i); // includes outer ( )
    } else {
      // Plain value – read until next comma or end
      const vs = i;
      while (i < optionStr.length && optionStr[i] !== ",") i++;
      value = optionStr.substring(vs, i).trim();
    }

    // ── Convert to JS type ──
    const schema = SETTINGS_SCHEMA[key];
    if (schema) {
      switch (schema.type) {
        case "number":
          settings[key] = parseFloat(value) || 0;
          break;
        case "boolean":
          settings[key] = value === "True" || value === "true";
          break;
        default:
          settings[key] = value;
      }
    } else {
      // Unknown key – keep raw string so round-trip is lossless
      settings[key] = value;
    }
  }

  return settings;
}

// ---------------------------------------------------------------------------
// Serializer
// ---------------------------------------------------------------------------

/** Format a single setting value for the INI file */
function formatValue(key: string, value: string | number | boolean): string {
  const schema = SETTINGS_SCHEMA[key];

  if (schema) {
    switch (schema.type) {
      case "boolean":
        return value ? "True" : "False";
      case "number": {
        const num =
          typeof value === "number" ? value : parseFloat(String(value)) || 0;
        if (schema.iniFormat === "integer") {
          return Math.round(num).toString();
        }
        // float → always 6 decimal places
        return num.toFixed(6);
      }
      case "string": {
        const str = String(value);
        switch (schema.iniFormat) {
          case "quoted":
            return `"${str}"`;
          case "unquoted":
            return str; // enum identifiers – NO quotes
          case "tuple":
            return str.startsWith("(") ? str : `(${str})`;
          default:
            return `"${str}"`;
        }
      }
    }
  }

  // ── Fallback for keys NOT in the schema ──
  // Since unknown keys are stored as raw strings during parsing,
  // we simply output them as-is to preserve the original format.
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

/**
 * Serialize a settings object back into PalWorldSettings.ini format
 */
export function serializeSettings(settings: PalWorldSettings): string {
  const pairs: string[] = [];

  for (const [key, value] of Object.entries(settings)) {
    pairs.push(`${key}=${formatValue(key, value)}`);
  }

  return `[/Script/Pal.PalGameWorldSettings]\nOptionSettings=(${pairs.join(",")})`;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate settings against the schema constraints.
 * Returns an array of errors (empty = all valid).
 */
export function validateSettings(
  settings: PalWorldSettings,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [key, value] of Object.entries(settings)) {
    const schema = SETTINGS_SCHEMA[key];
    if (!schema) continue;

    // ── Number validation ──
    if (schema.type === "number") {
      const num = typeof value === "number" ? value : parseFloat(String(value));
      if (isNaN(num)) {
        errors.push({ key, message: `${schema.label} must be a valid number` });
        continue;
      }
      if (schema.min !== undefined && num < schema.min) {
        errors.push({
          key,
          message: `${schema.label} must be at least ${schema.min}`,
        });
      }
      if (schema.max !== undefined && num > schema.max) {
        errors.push({
          key,
          message: `${schema.label} must be at most ${schema.max}`,
        });
      }
    }

    // ── Enum (options) validation ──
    if (
      schema.type === "string" &&
      schema.options &&
      schema.options.length > 0
    ) {
      const str = String(value);
      if (str !== "" && !schema.options.some((o) => o.value === str)) {
        errors.push({
          key,
          message: `${schema.label} must be one of: ${schema.options.map((o) => o.value).join(", ")}`,
        });
      }
    }
  }

  return errors;
}
