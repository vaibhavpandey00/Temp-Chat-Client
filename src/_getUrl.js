export const getUrl = () => {
    if (import.meta.env.VITE_IS_DEV === "true") {
        return "http://localhost:8000";
    } else {
        return import.meta.env.VITE_BACKEND_API;
    }
}