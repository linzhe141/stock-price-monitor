import { ref, onMounted, onUnmounted, computed } from 'vue';
import { getStocks } from '../api';
const stockData = ref([]);
const isHovered = ref(false);
let intervalId = null;
// 最多显示3只股票
const displayStocks = computed(() => stockData.value.slice(0, 3));
// 获取涨跌样式类
const getPriceClass = (changePercent) => {
    const value = parseFloat(changePercent);
    if (value > 0)
        return 'up';
    if (value < 0)
        return 'down';
    return '';
};
// 获取涨跌图标
const getChangeIcon = (changePercent) => {
    const value = parseFloat(changePercent);
    if (value > 0)
        return '↑';
    if (value < 0)
        return '↓';
    return '';
};
// 鼠标进入
const handleMouseEnter = () => {
    isHovered.value = true;
};
// 鼠标离开
const handleMouseLeave = () => {
    isHovered.value = false;
};
// 关闭悬浮窗
const handleClose = () => {
    console.log('点击关闭按钮');
    try {
        const ipc = window.ipcRenderer;
        if (ipc && ipc.send) {
            ipc.send('close-float-window');
            console.log('已发送关闭消息');
        }
        else {
            console.error('ipcRenderer 不可用');
        }
    }
    catch (e) {
        console.error('关闭悬浮窗失败:', e);
    }
};
// 获取股票数据
const fetchData = async () => {
    try {
        const res = await getStocks();
        stockData.value = Object.values(res.data);
        // 同时更新托盘提示
        if (stockData.value.length > 0) {
            const summary = stockData.value.slice(0, 3)
                .map(s => `${s.name}: ${s.price} (${s.change_percent}%)`)
                .join('\n');
            window.ipcRenderer?.send('update-tray', summary);
        }
    }
    catch (error) {
        console.error('获取股票数据失败:', error);
    }
};
onMounted(() => {
    fetchData();
    intervalId = setInterval(fetchData, 2000);
});
onUnmounted(() => {
    if (intervalId)
        clearInterval(intervalId);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-item']} */ ;
__VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onMouseenter: (__VLS_ctx.handleMouseEnter) },
    ...{ onMouseleave: (__VLS_ctx.handleMouseLeave) },
    ...{ class: "float-container" },
});
// @ts-ignore
[handleMouseEnter, handleMouseLeave,];
__VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "title-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "title" },
});
__VLS_asFunctionalElement(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.handleClose) },
    ...{ class: "close-btn" },
});
// @ts-ignore
[handleClose,];
__VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "stock-list" },
});
for (const [stock] of __VLS_getVForSourceType((__VLS_ctx.displayStocks))) {
    // @ts-ignore
    [displayStocks,];
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (stock.code),
        ...{ class: "stock-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stock-name" },
    });
    (stock.name);
    __VLS_asFunctionalElement(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stock-price" },
        ...{ class: (__VLS_ctx.getPriceClass(stock.change_percent)) },
    });
    // @ts-ignore
    [getPriceClass,];
    (stock.price);
    __VLS_asFunctionalElement(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stock-change" },
        ...{ class: (__VLS_ctx.getPriceClass(stock.change_percent)) },
    });
    // @ts-ignore
    [getPriceClass,];
    (__VLS_ctx.getChangeIcon(stock.change_percent));
    (stock.change_percent);
    // @ts-ignore
    [getChangeIcon,];
}
if (__VLS_ctx.displayStocks.length === 0) {
    // @ts-ignore
    [displayStocks,];
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
}
/** @type {__VLS_StyleScopedClasses['float-container']} */ ;
/** @type {__VLS_StyleScopedClasses['title-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-list']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-item']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-name']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-price']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-change']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
