export const getEnvMode = (): string | undefined => {
    const meta = import.meta as unknown as { env: { MODE: string | undefined } };
    return meta?.env?.MODE;
};
