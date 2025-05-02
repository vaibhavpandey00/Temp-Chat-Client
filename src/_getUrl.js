export const getUrl = () => {
    if (import.meta.env.VITE_IS_DEV === "true") {
        return "http://localhost:8080";
    } else {
        return import.meta.env.VITE_BACKEND_API;
    }
}