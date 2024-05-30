import fse from "fs-extra";
import rfs from "file-stream-rotator";
import pino, { multistream } from "pino";
import pretty from "pino-pretty";

const { logging: loggingConfigOverrides = {} } = {};

const {
    prettyPrint: prettyConfig = {},
    file: fileConfig = {},
    otherConfig = {},
    customLevels = {},
} = loggingConfigOverrides;

const loggingConfig = {
    postLevel: "error",
    stdout: true,
    logLevel: "debug",
    logFolder: "./logs",
    mixin: null,
};

const prettyPrintConfig = {
    translateTime: "SYS:yyyy-mm-dd h:MM:ss",
    ignore: "",
    colorize: false,
    singleLine: false,
    levelFirst: false,
};

const fileStreamConfig = {
    frequency: "daily",
    max_logs: "10d",
    date_format: "YYYY-MM-DD",
    size: "1m",
    extension: ".log",
};

function getStream({ level, destination, prettyPrint }) {
    return {
        level,
        stream: pretty({ ...prettyPrint, destination }),
    };
}

const { logFolder } = loggingConfig;
fse.ensureDir(logFolder);
const logLevel = loggingConfig.level || "info";

const mainStream = rfs.getStream({
    ...fileStreamConfig,
    filename: `${logFolder}/log-%DATE%`,
});
const errorStream = rfs.getStream({
    ...fileStreamConfig,
    filename: `${logFolder}/error-%DATE%`,
});
const slowStream = rfs.getStream({
    ...fileStreamConfig,
    filename: `${logFolder}/slow-%DATE%`,
});

const streams = [
    getStream({
        level: "error",
        destination: errorStream,
        prettyPrint: prettyPrintConfig,
    }),
    getStream({
        level: "slow",
        destination: slowStream,
        prettyPrint: { ...prettyPrintConfig },
    }),
];
if (loggingConfig.stdout !== false) {
    streams.push(
        getStream({
            level: logLevel,
            destination: process.stdout,
            prettyPrint: { ...prettyPrintConfig, colorize: true },
        })
    );
}
if (loggingConfig.logLevel !== "error") {
    streams.push(
        getStream({
            level: logLevel,
            destination: mainStream,
            prettyPrint: prettyPrintConfig,
        })
    );
}

const logger = pino(
    {
        level: logLevel || "info", // this MUST be set at the lowest level of the destination
        customLevels,
        mixin: loggingConfig.mixin,
    },
    multistream(streams, {
        dedupe: true,
        levels: { ...pino.levels, ...customLevels },
    })
);

export default logger;
