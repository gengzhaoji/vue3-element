<template>
    <div>
        <div class="user-info-head" @click.prevent="editCropper()">
            <img :src="options.img" title="点击上传头像" class="img-circle img-lg" />
        </div>
        <el-dialog :title="title" v-model="open" width="800px" append-to-body @opened="modalOpened">
            <el-row>
                <el-col :xs="24" :md="12" :style="{ height: '350px' }">
                    <vue-cropper
                        ref="cropper"
                        :img="options.img"
                        info
                        :autoCrop="options.autoCrop"
                        :autoCropWidth="options.autoCropWidth"
                        :autoCropHeight="options.autoCropHeight"
                        :fixedBox="options.fixedBox"
                        @realTime="realTime"
                        v-if="visible"
                    />
                </el-col>
                <el-col :xs="24" :md="12" class="flex-center" :style="{ height: '350px' }">
                    <div class="avatar-upload-preview">
                        <img :src="previews.url" :style="previews.img" />
                    </div>
                </el-col>
            </el-row>
            <br />
            <el-row>
                <el-col :lg="2" :md="2">
                    <el-upload action="#" :http-request="requestUpload" :show-file-list="false" :before-upload="beforeUpload">
                        <my-button>
                            选择图片
                            <el-icon><upload /></el-icon>
                        </my-button>
                    </el-upload>
                </el-col>
                <el-col :lg="{ span: 1, offset: 2 }" :md="2">
                    <my-button icon="Plus" @click.prevent="changeScale(1)"></my-button>
                </el-col>
                <el-col :lg="{ span: 1, offset: 1 }" :md="2">
                    <my-button icon="Minus" @click.prevent="changeScale(-1)"></my-button>
                </el-col>
                <el-col :lg="{ span: 1, offset: 1 }" :md="2">
                    <my-button icon="refresh-left" @click.prevent="rotateLeft()"></my-button>
                </el-col>
                <el-col :lg="{ span: 1, offset: 1 }" :md="2">
                    <my-button icon="refresh-right" @click.prevent="rotateRight()"></my-button>
                </el-col>
                <el-col :lg="{ span: 2, offset: 6 }" :md="2">
                    <my-button type="primary" @click.prevent="uploadImg()">上 传 头 像</my-button>
                </el-col>
            </el-row>
        </el-dialog>
    </div>
</template>

<script setup name="userAvatar">
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css';
import { uploadAvatar } from '@/api/public';
const props = defineProps({
    user: {
        type: Object,
    },
});
const $vm = inject('$vm');
let open = $ref(false), // 是否显示弹出层
    visible = $ref(false), // 是否显示cropper
    title = '修改头像',
    options = $ref({
        img: $vm.$store.user.avatar || props.user.avatar, //裁剪图片的地址
        autoCrop: true, // 是否默认生成截图框
        autoCropWidth: 200, // 默认生成截图框宽度
        autoCropHeight: 200, // 默认生成截图框高度
        fixedBox: true, // 固定截图框大小 不允许改变
    }),
    cropper = $ref(null),
    previews = $ref({});
function editCropper() {
    open = true;
}
// 打开弹出层结束时的回调
function modalOpened() {
    visible = true;
}
// 覆盖默认的上传行为
function requestUpload() {}
// 向左旋转
function rotateLeft() {
    cropper.rotateLeft();
}
// 向右旋转
function rotateRight() {
    cropper.rotateRight();
}
// 图片缩放
function changeScale(num) {
    num = num || 1;
    cropper.changeScale(num);
}
// 上传预处理
function beforeUpload(file) {
    if (file.type.indexOf('image/') == -1) {
        $vm.msgError('文件格式错误，请上传图片类型,如：JPG，PNG后缀的文件。');
    } else {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            options.img = reader.result;
        };
    }
}
// 上传图片
function uploadImg() {
    cropper.getCropBlob((data) => {
        let formData = new FormData();
        formData.append('avatarfile', data);
        uploadAvatar(formData).then((response) => {
            open = false;
            options.img = response.data;
            $vm.$store.user.avatar = response.data;
            $vm.msgSuccess('修改成功');
            visible = false;
        });
    });
}
// 实时预览
function realTime(data) {
    previews = data;
}
</script>

<style scoped lang="scss">
.user-info-head {
    position: relative;
    display: inline-block;
    height: 120px;
}
.img-lg {
    width: 120px;
    height: 120px;
}
.img-circle {
    border-radius: 50%;
}
.user-info-head:hover:after {
    content: '+';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    color: #eee;
    background: rgba(0, 0, 0, 0.5);
    font-size: 24px;
    font-style: normal;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    cursor: pointer;
    line-height: 110px;
    border-radius: 50%;
}
.avatar-upload-preview {
    overflow: hidden;
}
</style>
