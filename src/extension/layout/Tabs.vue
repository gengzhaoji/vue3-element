<template>
    <div class="tabs">
        <el-scrollbar class="scroll-container tags-view-container" ref="scrollbarDom">
            <el-tabs type="card" v-model="$store.user.activeMenuTab" tab-position="top" stretch @tab-remove="removeTab" @tab-click="clickTab">
                <el-tab-pane v-for="tab in menuTabsList" :key="tab.meta.title" :name="tab.meta.title" :label="tab.meta.title" :closable="!tab.meta.hideClose" lazy />
            </el-tabs>
        </el-scrollbar>
        <el-dropdown class="handle" placement="bottom-end">
            <div class="el-dropdown-link">
                <el-icon><arrow-down /></el-icon>
            </div>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item icon="back" @click="close('Left')"> 关闭左侧 </el-dropdown-item>
                    <el-dropdown-item icon="right" @click="close('Right')"> 关闭右侧 </el-dropdown-item>
                    <el-dropdown-item icon="close" @click="close('Other')"> 关闭其他 </el-dropdown-item>
                    <el-dropdown-item icon="circleClose" @click="close('All')" divided> 关闭全部 </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
    </div>
</template>

<script setup name="Tabs">
const $vm = inject('$vm');

// Tabs 数组数据
let menuTabsList = $ref($vm.$store.user.menuTabsList);
// 新增tabs
watch(
    () => menuTabsList,
    (val) => {
        $vm.$store.user.menuTabsList = val;
    },
    { deep: true }
);
// 新增tabs
watch(
    useRoute(),
    (val) => {
        addMenu(val);
    },
    { immediate: true }
);
// 选中当前标签
function clickTab(data) {
    const index = menuTabsList.findIndex((item) => item.meta.title === data.props.name);
    const { path, query } = menuTabsList[index];
    $vm.$router.push({ path, query });
}
// 关闭当前标签
function removeTab(name) {
    const index = menuTabsList.findIndex((item) => item.meta.title === name),
        { length } = menuTabsList,
        last = index === length - 1;
    menuTabsList.splice(index, 1);
    const data = menuTabsList[last ? index - 1 : index];
    $vm.$store.user.activeMenuTab = data?.meta?.title;
    $vm.$router.push({ path: data.path, query: data.query });
}
function close(type) {
    const i = menuTabsList.findIndex((item) => item.meta.title === $vm.$store.user.activeMenuTab);
    menuTabsList = $vm.clone(menuTabsList).filter((item, index) => {
        switch (type) {
            case 'Left':
                return index >= i;
                break;
            case 'Right':
                return index <= i;
                break;
            case 'Other':
                return index === i;
                break;
            case 'All':
                return index === 0;
        }
    });
    if (type === 'All') {
        $vm.$store.user.activeMenuTab = menuTabsList[0].meta.title;
        $vm.$router.push({ path: menuTabsList[0].path, query: menuTabsList[0].query });
    }
}
// 添加新的菜单项
function addMenu(menu) {
    let { path, meta, name, query } = menu;
    if (meta.hideTabs || menuTabsList.some((obj) => meta?.title?.includes('-') && meta?.title?.includes(obj?.meta?.title) && !menuTabsList.some((obj) => obj.path === path)))
        return;
    $vm.$store.user.activeMenuTab = meta.title;
    if (!menuTabsList.some((obj) => obj.path === path)) {
        menuTabsList.push({
            path,
            meta,
            name,
            query,
        });
    }
}
</script>

<style lang="scss" scoped>
$--height: 40px;
.tabs {
    width: 100%;
    display: flex;
    height: $--height;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.1);
    .el-dropdown-link {
        border-left: 1px solid var(--system-header-border-color);
        height: $--height;
        line-height: $--height;
        text-align: center;
        width: 40px;
        i {
            color: var(--system-header-text-color);
        }
    }

    :deep() {
        .el-tabs__nav-next,
        .el-tabs__nav-prev {
            line-height: $--height !important;
            color: var(--system-header-text-color) !important;
        }
        .el-tabs--card > .el-tabs__header .el-tabs__nav {
            border-left: none;
        }
    }
}
.tags-view-container {
    height: 100%;
    width: calc(100% - 46px);
    display: flex;
    :deep() {
        .el-tabs__header {
            margin: 0px;
        }
        .el-tabs--card > .el-tabs__header .el-tabs__nav {
            border-top: none;
            border-radius: 0;
            .el-tabs__item {
                height: $--height;
            }
        }
    }
    :deep(.el-scrollbar__bar.is-vertical) {
        display: none !important;
    }
}
</style>
