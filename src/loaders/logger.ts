import * as winston from 'winston'
import config from '../config'

const { combine, timestamp, label, printf } = winston.format
const customFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`
})

let transports = []

if (process.env.NODE_ENV !== 'development') {
    transports.push(
        new winston.transports.Console()
    )
} else {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.cli(),
                winston.format.splat(),
                customFormat
            )
        })
    )
}

export const logger = winston.createLogger({
    level: config.logs.level,
    levels: winston.config.npm.levels,
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.label({ label: 'App' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
        customFormat
    ),
    transports
})

export default function createLogger(label: string) {
    return winston.createLogger({
        level: config.logs.level,
        levels: winston.config.npm.levels,
        format: winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.label({ label }),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.json(),
            customFormat
        ),
        transports
    })
}
