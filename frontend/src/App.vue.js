import { ref, onMounted } from 'vue';
import Dashboard from './components/Dashboard.vue';
import FloatWindow from './components/FloatWindow.vue';
import Settings from './components/Settings.vue';
import StockDetail from './components/StockDetail.vue';
const currentPage = ref('dashboard');
const isFloatWindow = ref(false);
const detailCode = ref('');
const openSettings = () => { currentPage.value = 'settings'; };
const backToDashboard = () => { currentPage.value = 'dashboard'; };
// 打开股票详情
const openStockDetail = (code) => {
    detailCode.value = code;
    currentPage.value = 'detail';
};
onMounted(() => {
    isFloatWindow.value = window.location.hash === '#/float';
    window.addEventListener('hashchange', () => {
        isFloatWindow.value = window.location.hash === '#/float';
    });
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.isFloatWindow) {
    // @ts-ignore
    [isFloatWindow,];
    /** @type {[typeof FloatWindow, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(FloatWindow, new FloatWindow({}));
    const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
    var __VLS_4 = {};
    var __VLS_2;
}
else {
    if (__VLS_ctx.currentPage === 'settings') {
        // @ts-ignore
        [currentPage,];
        /** @type {[typeof Settings, ]} */ ;
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent(Settings, new Settings({
            ...{ 'onBack': {} },
        }));
        const __VLS_7 = __VLS_6({
            ...{ 'onBack': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_6));
        let __VLS_10;
        const __VLS_11 = ({ back: {} },
            { onBack: (__VLS_ctx.backToDashboard) });
        var __VLS_12 = {};
        // @ts-ignore
        [backToDashboard,];
        var __VLS_8;
        var __VLS_9;
    }
    else if (__VLS_ctx.currentPage === 'detail') {
        // @ts-ignore
        [currentPage,];
        /** @type {[typeof StockDetail, ]} */ ;
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent(StockDetail, new StockDetail({
            ...{ 'onBack': {} },
            code: (__VLS_ctx.detailCode),
        }));
        const __VLS_15 = __VLS_14({
            ...{ 'onBack': {} },
            code: (__VLS_ctx.detailCode),
        }, ...__VLS_functionalComponentArgsRest(__VLS_14));
        let __VLS_18;
        const __VLS_19 = ({ back: {} },
            { onBack: (__VLS_ctx.backToDashboard) });
        var __VLS_20 = {};
        // @ts-ignore
        [backToDashboard, detailCode,];
        var __VLS_16;
        var __VLS_17;
    }
    else {
        /** @type {[typeof Dashboard, ]} */ ;
        // @ts-ignore
        const __VLS_22 = __VLS_asFunctionalComponent(Dashboard, new Dashboard({
            ...{ 'onOpenSettings': {} },
            ...{ 'onOpenDetail': {} },
        }));
        const __VLS_23 = __VLS_22({
            ...{ 'onOpenSettings': {} },
            ...{ 'onOpenDetail': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_22));
        let __VLS_26;
        const __VLS_27 = ({ openSettings: {} },
            { onOpenSettings: (__VLS_ctx.openSettings) });
        const __VLS_28 = ({ openDetail: {} },
            { onOpenDetail: (__VLS_ctx.openStockDetail) });
        var __VLS_29 = {};
        // @ts-ignore
        [openSettings, openStockDetail,];
        var __VLS_24;
        var __VLS_25;
    }
}
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
