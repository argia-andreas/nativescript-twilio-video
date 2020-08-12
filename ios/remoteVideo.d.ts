import { View } from 'tns-core-modules/ui/core/view';
export declare class RemoteVideo extends View {
    remoteVideoView: any;
    _remoteViewDelegate: any;
    nativeView: UIView;
    constructor();
    createNativeView(): any;
    disposeNativeView(): void;
    readonly ios: any;
}
