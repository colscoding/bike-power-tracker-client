export const getEnv = (): { MODE: string | undefined, DEV: string | undefined } => {
    const meta = import.meta as unknown as { env: { MODE: string | undefined, DEV: string | undefined } };
    return meta?.env;
};


export const getEnvMode = (): string | undefined => {
    const env = getEnv();
    return env?.MODE;
};

export const getEnvDev = (): string | undefined => {
    const env = getEnv();
    return env?.DEV;
};