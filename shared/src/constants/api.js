"use strict";
// API route path constants matching the blueprint.
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ROUTES = void 0;
exports.API_ROUTES = {
    AUTH: {
        REGISTER: "/auth/register",
        LOGIN: "/auth/login",
    },
    VAULT: {
        LIST: "/vault",
        CREATE: "/vault",
        BY_ID: (id) => `/vault/${id}`,
    },
};
//# sourceMappingURL=api.js.map