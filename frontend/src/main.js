import { createApp } from "vue";
import ElementPlus from "element-plus";
import Vant from "vant";
import "element-plus/dist/index.css";
import "vant/lib/index.css";
import "./styles.css";
import App from "./App.vue";
import router from "./router";

const savedTheme = localStorage.getItem("course-checkin-theme") || "auto";
const initialTheme = ["light", "dark", "auto"].includes(savedTheme) ? savedTheme : "auto";

document.documentElement.dataset.theme = initialTheme;
document.documentElement.style.colorScheme =
  initialTheme === "dark" ? "dark" : initialTheme === "light" ? "light" : "light dark";

createApp(App).use(router).use(ElementPlus).use(Vant).mount("#app");
