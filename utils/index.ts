import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isValidUUID(id: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(id);
}

export function isOldMsg(msgDate: Date) {
    const currentDate = new Date();

    const milliDiff = currentDate.getTime() - msgDate.getTime();
    const hoursDiff = Math.floor(milliDiff / (1000 * 60 * 60));

    if (hoursDiff >= 24) {
        return true;
    } else {
        return false;
    }
}
