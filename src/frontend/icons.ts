function svg(inner: string): string {
    return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

export const menuIcon = (): string =>
    svg(`<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>`);

export const searchIcon = (): string =>
    svg(`<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`);

export const pinIcon = (): string =>
    svg(`<path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>`);

export const clockIcon = (): string =>
    svg(`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>`);

export const dropletIcon = (): string =>
    svg(`<path d="M12 2.5s6.5 7.3 6.5 12A6.5 6.5 0 0 1 5.5 14.5C5.5 9.8 12 2.5 12 2.5z"/>`);

export const windIcon = (): string =>
    svg(`<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 13h15a3 3 0 1 1-3 3"/><path d="M3 18h8"/>`);

export const sunIcon = (): string =>
    svg(`<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8"/>`);

export const moonIcon = (): string =>
    svg(`<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>`);

export const cloudIcon = (): string =>
    svg(`<path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7.1 9.6 4 4 0 0 0 7 18z"/>`);

export const cloudRainIcon = (): string =>
    svg(`<path d="M7 15h9.5a3.75 3.75 0 0 0 .47-7.47A5.25 5.25 0 0 0 7.14 6.9 3.75 3.75 0 0 0 7 15z"/><line x1="9" y1="18" x2="9" y2="21"/><line x1="13" y1="18" x2="13" y2="21"/><line x1="17" y1="18" x2="17" y2="21"/>`);

export const cloudSnowIcon = (): string =>
    svg(`<path d="M7 15h9.5a3.75 3.75 0 0 0 .47-7.47A5.25 5.25 0 0 0 7.14 6.9 3.75 3.75 0 0 0 7 15z"/><line x1="8" y1="18.5" x2="8" y2="18.51"/><line x1="12" y1="20" x2="12" y2="20.01"/><line x1="16" y1="18.5" x2="16" y2="18.51"/><line x1="12" y1="17" x2="12" y2="17.01"/>`);

export const cloudLightningIcon = (): string =>
    svg(`<path d="M7 14h9.5a3.75 3.75 0 0 0 .47-7.47A5.25 5.25 0 0 0 7.14 5.9 3.75 3.75 0 0 0 7 14z"/><path d="M12.5 16l-2.5 4h3l-2 4"/>`);

export const cloudFogIcon = (): string =>
    svg(`<path d="M7 12.5h9.5a3.75 3.75 0 0 0 .3-7.48A5.25 5.25 0 0 0 7.14 4.4 3.75 3.75 0 0 0 7 12.5z"/><line x1="5" y1="17" x2="19" y2="17"/><line x1="7" y1="20" x2="17" y2="20"/>`);

export const eyeIcon = (): string =>
    svg(`<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.75"/>`);

export const sunriseIcon = (): string =>
    svg(`<path d="M12 4v4"/><path d="M5.6 9.6l1.8 1.8"/><path d="M18.4 9.6l-1.8 1.8"/><path d="M2 17h20"/><path d="M6 17a6 6 0 0 1 12 0"/>`);

export const sunsetIcon = (): string =>
    svg(`<path d="M12 12V8"/><path d="M5.6 9.6l1.8 1.8"/><path d="M18.4 9.6l-1.8 1.8"/><path d="M2 17h20"/><path d="M6 17a6 6 0 0 1 12 0"/>`);

export const warningIcon = (): string =>
    svg(`<path d="M12 3.5 22 20H2z"/><line x1="12" y1="9.5" x2="12" y2="14"/><line x1="12" y1="16.8" x2="12" y2="16.81"/>`);

const CONDITION_ICON: Record<string, (isDay: boolean) => string> = {
    "clear": (isDay) => (isDay ? sunIcon() : moonIcon()),
    "partly-cloudy": () => cloudIcon(),
    "cloudy": () => cloudIcon(),
    "overcast": () => cloudIcon(),
    "fog": () => cloudFogIcon(),
    "drizzle": () => cloudRainIcon(),
    "rain": () => cloudRainIcon(),
    "sleet": () => cloudSnowIcon(),
    "snow": () => cloudSnowIcon(),
    "thunderstorm": () => cloudLightningIcon(),
};

export function conditionIconFor(category: string, isDay: boolean): string {
    const fn = CONDITION_ICON[category];
    return fn ? fn(isDay) : cloudIcon();
}
