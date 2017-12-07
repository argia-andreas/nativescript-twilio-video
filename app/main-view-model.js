"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var observable_1 = require("data/observable");
var app = require("tns-core-modules/application");
var nativescript_twilio_video_1 = require("nativescript-twilio-video");
var dialogs = require("ui/dialogs");
var http = require("http");
var permissions = require('nativescript-permissions');
var timer = require("timer");
var HelloWorldModel = (function (_super) {
    __extends(HelloWorldModel, _super);
    function HelloWorldModel(page) {
        var _this = _super.call(this) || this;
        _this.page = page;
        _this.countdown = 60;
        var container = _this.page.getViewById('s');
        _this.videoActivity = new nativescript_twilio_video_1.VideoActivity();
        _this.localVideo = new nativescript_twilio_video_1.LocalVideo();
        _this.remoteVideo = new nativescript_twilio_video_1.RemoteVideo();
        _this.localVideo.className = 'box';
        _this.remoteVideo.className = 'box';
        container.insertChild(_this.localVideo, 0);
        container.insertChild(_this.remoteVideo, 1);
        _this.videoActivity.localVideoView = _this.localVideo.localVideoView;
        _this.videoActivity.remoteVideoView = _this.remoteVideo.remoteVideoView;
        _this.videoActivity.event.on('error', function (reason) {
            _this.set("error", reason.object['reason']);
            console.log(JSON.stringify(reason.object['reason']));
        });
        _this.videoActivity.event.on('didConnectToRoom', function (r) {
            if (r.object['count'] < 1)
                return;
            console.log("didConnectToRoom zz");
            console.log(JSON.stringify(r));
        });
        _this.videoActivity.event.on('didFailToConnectWithError', function (r) {
            console.log("didFailToConnectWithError");
        });
        _this.videoActivity.event.on('participantDidConnect', function (r) {
            if (r.object['count'] < 1)
                return;
            if (app.ios && container.getChildIndex(_this.remoteVideo) === -1) {
                console.log('adding view');
                _this.add_remote_view(container);
            }
            console.log(JSON.stringify(r));
            console.log("participantDidConnect");
        });
        _this.videoActivity.event.on('participantDidDisconnect', function (r) {
            if (app.ios) {
                container.removeChild(_this.remoteVideo);
            }
            console.log("participantDidDisconnect");
        });
        _this.videoActivity.event.on('onVideoTrackSubscribed', function (r) {
            console.log("onVideoTrackSubscribed 00");
            if (app.ios) {
                console.log(_this.videoActivity.videoTrack);
            }
        });
        _this.videoActivity.event.on('onVideoTrackUnsubscribed', function (r) {
            console.log("onVideoTrackUnsubscribed 00");
        });
        _this.videoActivity.event.on('participantDisabledVideoTrack', function (r) {
            console.log("participantDisabledVideoTrack");
        });
        _this.videoActivity.event.on('participantEnabledVideoTrack', function (r) {
            console.log("participantEnabledVideoTrack");
        });
        _this.videoActivity.event.on('participantDisabledAudioTrack', function (r) {
            console.log("participantDisabledAudioTrack");
        });
        _this.videoActivity.event.on('participantEnabledAudioTrack', function (r) {
            console.log("participantEnabledAudioTrack");
        });
        _this.getPermissions()
            .then(function () {
            var t = timer.setTimeout(function () {
                _this.videoActivity.startPreview();
                timer.clearTimeout(t);
            }, 1200);
        })
            .then(function () { return _this.getToken(); })
            .then(function (result) {
            var result = result.content.toJSON();
            _this.videoActivity.set_access_token(result['token']);
        });
        return _this;
    }
    HelloWorldModel.prototype.add_remote_view = function (c) {
        this.remoteVideo = new nativescript_twilio_video_1.RemoteVideo();
        this.videoActivity.remoteVideoView = this.remoteVideo.remoteVideoView;
        this.remoteVideo.className = 'box';
        c.insertChild(this.remoteVideo, 1);
    };
    HelloWorldModel.prototype.check_permissions = function () {
        var audio, camera;
        if (app.android) {
            audio = permissions.hasPermission("android.permission.RECORD_AUDIO");
            camera = permissions.hasPermission("android.permission.CAMERA");
        }
        else {
            camera = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);
            audio = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeAudio);
            if (camera < 3)
                camera = false;
            if (audio < 3)
                audio = false;
        }
        if (!audio || !camera)
            return false;
        else
            return true;
    };
    HelloWorldModel.prototype.getPermissions = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var has_permissions = _this.check_permissions();
            if (has_permissions) {
                resolve();
                return;
            }
            if (app.android) {
                permissions.requestPermissions([
                    "android.permission.RECORD_AUDIO",
                    "android.permission.CAMERA"
                ], "I need these permissions because I'm cool")
                    .then(function (response) {
                    console.dir(response);
                    resolve(response);
                })
                    .catch(function (e) {
                    console.dir(e);
                    console.log("Uh oh, no permissions - plan B time!");
                    var has_permissions = _this.check_permissions();
                    if (!has_permissions) {
                        dialogs.alert("without mic and camera permissions \n you cannot meet potential matches through video chat. \n please allow permissions in settings and try again.").then(function () {
                        });
                    }
                });
            }
            else {
                Promise.all([_this.ios_mic_permission(), _this.ios_camera_permission()])
                    .then(function (values) {
                    console.log(JSON.stringify(values));
                    resolve();
                }, function (reason) {
                    console.log(JSON.stringify(reason));
                    _this.set('error', reason);
                    dialogs.alert("without mic and camera permissions \n you cannot meet potential matches through video chat. \n please allow permissions in settings and try again.").then(function () {
                        UIApplication.sharedApplication.openURL(NSURL.URLWithString(UIApplicationOpenSettingsURLString));
                    });
                    reject();
                });
            }
        });
    };
    HelloWorldModel.prototype.ios_mic_permission = function () {
        return new Promise(function (resolve, reject) {
            var has_asked = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeAudio);
            if (has_asked === 2) {
                reject('mic permission denied');
                return;
            }
            AVAudioSession.sharedInstance().requestRecordPermission(function (bool) {
                if (bool === true) {
                    resolve(bool);
                    return;
                }
                reject('mic permission denied');
            });
        });
    };
    HelloWorldModel.prototype.ios_camera_permission = function () {
        return new Promise(function (resolve, reject) {
            var has_asked = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);
            if (has_asked === 2) {
                reject('camera permission denied');
                return;
            }
            AVCaptureDevice.requestAccessForMediaTypeCompletionHandler(AVMediaTypeVideo, function (bool) {
                if (bool === true) {
                    resolve(bool);
                    return;
                }
                reject('camera permission denied');
            });
        });
    };
    HelloWorldModel.prototype.disconnect = function () {
        if (this.videoActivity.room) {
            this.videoActivity.disconnect();
        }
    };
    HelloWorldModel.prototype.add_time = function () {
    };
    HelloWorldModel.prototype.toggle_local_audio = function () {
        this.videoActivity.toggle_local_audio();
    };
    HelloWorldModel.prototype.toggle_local_video = function () {
        this.videoActivity.toggle_local_video();
    };
    HelloWorldModel.prototype.connect_to_room = function () {
        var text = this.get('textfield');
        this.videoActivity.connect_to_room(text);
    };
    HelloWorldModel.prototype.getToken = function () {
        console.log('getToken');
        var user = {
            uid: ''
        };
        if (app.android) {
            user.uid = 'android';
        }
        else {
            user.uid = 'ios';
        }
        return http.request({
            url: "https://us-central1-firebase-goblur.cloudfunctions.net/get_token",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            content: JSON.stringify(user)
        });
    };
    return HelloWorldModel;
}(observable_1.Observable));
exports.HelloWorldModel = HelloWorldModel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi12aWV3LW1vZGVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi12aWV3LW1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsOENBQXlEO0FBRXpELGtEQUFvRDtBQUVwRCx1RUFBa0Y7QUFDbEYsb0NBQXNDO0FBR3RDLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQixJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUN0RCxJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFJL0I7SUFBcUMsbUNBQVU7SUFpQjNDLHlCQUFvQixJQUFVO1FBQTlCLFlBQ0ksaUJBQU8sU0FrSVY7UUFuSW1CLFVBQUksR0FBSixJQUFJLENBQU07UUFSdkIsZUFBUyxHQUFXLEVBQUUsQ0FBQztRQVcxQixJQUFJLFNBQVMsR0FBZ0IsS0FBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFeEQsS0FBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLHlDQUFhLEVBQUUsQ0FBQztRQUV6QyxLQUFJLENBQUMsVUFBVSxHQUFHLElBQUksc0NBQVUsRUFBRSxDQUFDO1FBRW5DLEtBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSx1Q0FBVyxFQUFFLENBQUM7UUFFckMsS0FBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBRWxDLEtBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUVuQyxTQUFTLENBQUMsV0FBVyxDQUFDLEtBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFMUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxLQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRTNDLEtBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxHQUFHLEtBQUksQ0FBQyxVQUFVLENBQUMsY0FB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LDRDQUFrQixHQUF6QjtRQUVJLElBQUksQ0FBQyxhQUFhLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUU1QyxDQUFDO0lBRU0seUNBQWUsR0FBdEI7UUFFSSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRWpDLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTdDLENBQUM7SUFHTSxrQ0FBUSxHQUFmO1FBQ0ksT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN4QixJQUFJLElBQUksR0FBRztZQUNQLEdBQUcsRUFBRSxFQUFFO1NBQ1YsQ0FBQztRQUVGLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2QsSUFBSSxDQUFDLEdBQUcsR0FBRyxTQUFTLENBQUE7UUFDeEIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUM7UUFDckIsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ2hCLEdBQUcsRUFBRSxrRUFBa0U7WUFDdkUsTUFBTSxFQUFFLE1BQU07WUFDZCxPQUFPLEVBQUUsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUU7WUFDL0MsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO1NBQ2hDLENBQUMsQ0FBQztJQUdQLENBQUM7SUFHTCxzQkFBQztBQUFELENBQUMsQUExV0QsQ0FBcUMsdUJBQVUsR0EwVzlDO0FBMVdZLDBDQUFlIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbU9iamVjdCB9IGZyb20gJ2RhdGEvb2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBQYWdlIH0gZnJvbSAndWkvcGFnZSc7XG5pbXBvcnQgKiBhcyBhcHAgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvYXBwbGljYXRpb25cIjtcbmltcG9ydCB7IFZpZXcgfSBmcm9tIFwidWkvY29yZS92aWV3XCJcbmltcG9ydCB7IExvY2FsVmlkZW8sIFZpZGVvQWN0aXZpdHksIFJlbW90ZVZpZGVvfSBmcm9tICduYXRpdmVzY3JpcHQtdHdpbGlvLXZpZGVvJztcbmltcG9ydCAqIGFzIGRpYWxvZ3MgZnJvbSBcInVpL2RpYWxvZ3NcIjtcbmltcG9ydCB7IFN0YWNrTGF5b3V0IH0gZnJvbSAndG5zLWNvcmUtbW9kdWxlcy91aS9sYXlvdXRzL3N0YWNrLWxheW91dC9zdGFjay1sYXlvdXQnO1xuXG52YXIgaHR0cCA9IHJlcXVpcmUoXCJodHRwXCIpO1xudmFyIHBlcm1pc3Npb25zID0gcmVxdWlyZSgnbmF0aXZlc2NyaXB0LXBlcm1pc3Npb25zJyk7XG5jb25zdCB0aW1lciA9IHJlcXVpcmUoXCJ0aW1lclwiKTtcblxuXG5cbmV4cG9ydCBjbGFzcyBIZWxsb1dvcmxkTW9kZWwgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcbiAgICBcbiAgICBwcml2YXRlIGxvY2FsVmlkZW86IExvY2FsVmlkZW87XG4gICAgcHJpdmF0ZSByZW1vdGVWaWRlbzogUmVtb3RlVmlkZW87XG4gICAgcHJpdmF0ZSBhY2Nlc3NUb2tlbjogc3RyaW5nO1xuICAgIHByaXZhdGUgcm9vbU5hbWU6IHN0cmluZztcbiAgICBwdWJsaWMgbmFtZTogc3RyaW5nO1xuICAgIHByaXZhdGUgaGVyb3M6IGFueTtcbiAgICBwdWJsaWMgcGFydGljaXBhbnQ6IGFueTtcbiAgICBwdWJsaWMgY291bnRkb3duOiBudW1iZXIgPSA2MDtcbiAgICBwdWJsaWMgcm9vbUJ1dHRvbjogYW55O1xuICAgIHB1YmxpYyB1aXZpZXc6IFVJVmlldztcbiAgICBsb2NhbFZpZGVvVmlldzogYW55O1xuICAgIGVycm9yOiBzdHJpbmc7XG4gICAgdmlkZW9UcmFjazogYW55O1xuICAgIHZpZGVvQWN0aXZpdHk6IFZpZGVvQWN0aXZpdHk7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhZ2U6IFBhZ2UpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB2YXIgY29udGFpbmVyID0gPFN0YWNrTGF5b3V0PnRoaXMucGFnZS5nZXRWaWV3QnlJZCgncycpO1xuXG4gICAgICAgIHRoaXMudmlkZW9BY3Rpdml0eSA9IG5ldyBWaWRlb0FjdGl2aXR5KCk7XG5cbiAgICAgICAgdGhpcy5sb2NhbFZpZGVvID0gbmV3IExvY2FsVmlkZW8oKTtcblxuICAgICAgICB0aGlzLnJlbW90ZVZpZGVvID0gbmV3IFJlbW90ZVZpZGVvKCk7XG5cbiAgICAgICAgdGhpcy5sb2NhbFZpZGVvLmNsYXNzTmFtZSA9ICdib3gnO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5yZW1vdGVWaWRlby5jbGFzc05hbWUgPSAnYm94JztcblxuICAgICAgICBjb250YWluZXIuaW5zZXJ0Q2hpbGQodGhpcy5sb2NhbFZpZGVvLCAwKTtcblxuICAgICAgICBjb250YWluZXIuaW5zZXJ0Q2hpbGQodGhpcy5yZW1vdGVWaWRlbywgMSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnZpZGVvQWN0aXZpdHkubG9jYWxWaWRlb1ZpZXcgPSB0aGlzLmxvY2FsVmlkZW8ubG9jYWxWaWRlb1ZpZXc7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnZpZGVvQWN0aXZpdHkucmVtb3RlVmlkZW9WaWV3ID0gdGhpcy5yZW1vdGVWaWRlby5yZW1vdGVWaWRlb1ZpZXc7XG5cbiAgICAgICAgLy8gdGltZXIuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2codGhpcy52aWRlb0FjdGl2aXR5LnJlbW90ZVBhcnRpY2lwYW50cyA/IHRoaXMudmlkZW9BY3Rpdml0eS5yZW1vdGVQYXJ0aWNpcGFudHMucmVtb3RlVmlkZW9UcmFja3NbMF0ucmVtb3RlVHJhY2sgOiB1bmRlZmluZWQpO1xuICAgICAgICAvLyB9LCAzMDAwKVxuXG4gICAgICAgIHRoaXMudmlkZW9BY3Rpdml0eS5ldmVudC5vbignZXJyb3InLCAocmVhc29uKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldChcImVycm9yXCIsIHJlYXNvbi5vYmplY3RbJ3JlYXNvbiddKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlYXNvbi5vYmplY3RbJ3JlYXNvbiddKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcblxuICAgICAgICB0aGlzLnZpZGVvQWN0aXZpdHkuZXZlbnQub24oJ2RpZENvbm5lY3RUb1Jvb20nLCAocikgPT4ge1xuICAgICAgICAgICAgaWYgKHIub2JqZWN0Wydjb3VudCddIDwgMSkgcmV0dXJuO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJkaWRDb25uZWN0VG9Sb29tIHp6XCIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocikpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnZpZGVvQWN0aXZpdHkuZXZlbnQub24oJ2RpZEZhaWxUb0Nvbm5lY3RXaXRoRXJyb3InLCAocikgPT4ge1xuICAgICAgICAgICAgLy8gaWYgKGFwcC5pb3MpIHRoaXMuY2xlYW51cFJlbW90ZVBhcnRpY2lwYW50KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZGlkRmFpbFRvQ29ubmVjdFdpdGhFcnJvclwiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy52aWRlb0FjdGl2aXR5LmV2ZW50Lm9uKCdwYXJ0aWNpcGFudERpZENvbm5lY3QnLCAocikgPT4ge1xuICAgICAgICAgICAgaWYgKHIub2JqZWN0Wydjb3VudCddIDwgMSkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKGFwcC5pb3MgJiYgY29udGFpbmVyLmdldENoaWxkSW5kZXgodGhpcy5yZW1vdGVWaWRlbykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2FkZGluZyB2aWV3Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRfcmVtb3RlX3ZpZXcoY29udGFpbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocikpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJwYXJ0aWNpcGFudERpZENvbm5lY3RcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMudmlkZW9BY3Rpdml0eS5ldmVudC5vbigncGFydGljaXBhbnREaWREaXNjb25uZWN0JywgKHIpID0+IHtcbiAgICAgICAgICAgIGlmIChhcHAuaW9zKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMucmVtb3RlVmlkZW8pO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuY2xlYW51cFJlbW90ZVBhcnRpY2lwYW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicGFydGljaXBhbnREaWREaXNjb25uZWN0XCIpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyB0aGlzLnZpZGVvQWN0aXZpdHkuZXZlbnQub24oJ3BhcnRpY2lwYW50VW5wdWJsaXNoZWRBdWRpb1RyYWNrJywgKHIpID0+IHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKFwicGFydGljaXBhbnRVbnB1Ymxpc2hlZEF1ZGlvVHJhY2tcIik7XG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIC8vIHRoaXMudmlkZW9BY3Rpdml0eS5ldmVudC5vbigncGFydGljaXBhbnRQdWJsaXNoZWRWaWRlb1RyYWNrJywgKHIpID0+IHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKFwicGFydGljaXBhbnRQdWJsaXNoZWRWaWRlb1RyYWNrXCIpO1xuICAgICAgICAvLyB9KTtcblxuICAgICAgICAvLyB0aGlzLnZpZGVvQWN0aXZpdHkuZXZlbnQub24oJ3BhcnRpY2lwYW50VW5wdWJsaXNoZWRWaWRlb1RyYWNrJywgKHIpID0+IHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKFwicGFydGljaXBhbnRVbnB1Ymxpc2hlZFZpZGVvVHJhY2tcIik7XG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIC8vIHRoaXMudmlkZW9BY3Rpdml0eS5ldmVudC5vbignb25BdWRpb1RyYWNrU3Vic2NyaWJlZCcsIChyKSA9PiB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhcIm9uQXVkaW9UcmFja1N1YnNjcmliZWRcIik7XG4gICAgICAgIC8vIH0pO1xuXG4gICAgICAgIC8vIHRoaXMudmlkZW9BY3Rpdml0eS5ldmVudC5vbignb25BdWRpb1RyYWNrVW5zdWJzY3JpYmVkJywgKHIpID0+IHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKFwib25BdWRpb1RyYWNrVW5zdWJzY3JpYmVkXCIpO1xuICAgICAgICAvLyB9KTtcblxuICAgICAgICB0aGlzLnZpZGVvQWN0aXZpdHkuZXZlbnQub24oJ29uVmlkZW9UcmFja1N1YnNjcmliZWQnLCAocikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJvblZpZGVvVHJhY2tTdWJzY3JpYmVkIDAwXCIpO1xuICAgICAgICAgICAgaWYgKGFwcC5pb3MpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLnZpZGVvVHJhY2sgPSB0aGlzLnZpZGVvQWN0aXZpdHkucmVtb3RlUGFydGljaXBhbnRzLnJlbW90ZVZpZGVvVHJhY2tzWzBdLnJlbW90ZVRyYWNrO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMudmlkZW9BY3Rpdml0eS52aWRlb1RyYWNrKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmFkZF9yZW1vdGVfdmlldygpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMudmlkZW9BY3Rpdml0eS5yZW1vdGVWaWRlb1ZpZXcgPSB0aGlzLnJlbW90ZVZpZGVvLnJlbW90ZVZpZGVvVmlldztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy52aWRlb0FjdGl2aXR5LmV2ZW50Lm9uKCdvblZpZGVvVHJhY2tVbnN1YnNjcmliZWQnLCAocikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJvblZpZGVvVHJhY2tVbnN1YnNjcmliZWQgMDBcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMudmlkZW9BY3Rpdml0eS5ldmVudC5vbigncGFydGljaXBhbnREaXNhYmxlZFZpZGVvVHJhY2snLCAocikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJwYXJ0aWNpcGFudERpc2FibGVkVmlkZW9UcmFja1wiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy52aWRlb0FjdGl2aXR5LmV2ZW50Lm9uKCdwYXJ0aWNpcGFudEVuYWJsZWRWaWRlb1RyYWNrJywgKHIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicGFydGljaXBhbnRFbmFibGVkVmlkZW9UcmFja1wiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy52aWRlb0FjdGl2aXR5LmV2ZW50Lm9uKCdwYXJ0aWNpcGFudERpc2FibGVkQXVkaW9UcmFjaycsIChyKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBhcnRpY2lwYW50RGlzYWJsZWRBdWRpb1RyYWNrXCIpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnZpZGVvQWN0aXZpdHkuZXZlbnQub24oJ3BhcnRpY2lwYW50RW5hYmxlZEF1ZGlvVHJhY2snLCAocikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJwYXJ0aWNpcGFudEVuYWJsZWRBdWRpb1RyYWNrXCIpO1xuICAgICAgICB9KTtcblxuICAgICAgICBcbiAgICAgICAgdGhpcy5nZXRQZXJtaXNzaW9ucygpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIHQgPSB0aW1lci5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWRlb0FjdGl2aXR5LnN0YXJ0UHJldmlldygpO1xuICAgICAgICAgICAgICAgICAgICB0aW1lci5jbGVhclRpbWVvdXQodCk7XG4gICAgICAgICAgICAgICAgfSwgMTIwMClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoKSA9PiB0aGlzLmdldFRva2VuKCkpXG4gICAgICAgICAgICAudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHJlc3VsdC5jb250ZW50LnRvSlNPTigpO1xuICAgICAgICAgICAgICAgIHRoaXMudmlkZW9BY3Rpdml0eS5zZXRfYWNjZXNzX3Rva2VuKHJlc3VsdFsndG9rZW4nXSk7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy52aWRlb0FjdGl2aXR5LmFjY2Vzc1Rva2VuID0gcmVzdWx0Wyd0b2tlbiddO1xuICAgICAgICAgICAgfSlcbiAgIFxuXG4gICAgfVxuXG4gICAgLy8gY2xlYW51cFJlbW90ZVBhcnRpY2lwYW50KCk6IHZvaWQge1xuICAgIC8vICAgICB0aGlzLnZpZGVvVHJhY2sucmVtb3ZlUmVuZGVyZXIodGhpcy52aWRlb0FjdGl2aXR5LnJlbW90ZVZpZGVvVmlldyk7XG4gICAgLy8gICAgIHRoaXMudmlkZW9BY3Rpdml0eS5yZW1vdGVWaWRlb1ZpZXcucmVtb3ZlRnJvbVN1cGVydmlldygpO1xuICAgIC8vICAgICAvLyBpZiAodGhpcy52aWRlb0FjdGl2aXR5LnJlbW90ZVBhcnRpY2lwYW50cyAmJiB0aGlzLnZpZGVvQWN0aXZpdHkucmVtb3RlUGFydGljaXBhbnRzLnZpZGVvVHJhY2tzLmNvdW50ID4gMCkge1xuICAgIC8vICAgICAvLyAgICAgdmFyIHZpZGVvVHJhY2sgPSB0aGlzLnZpZGVvQWN0aXZpdHkucmVtb3RlUGFydGljaXBhbnRzLnJlbW90ZVZpZGVvVHJhY2tzWzBdLnJlbW90ZVRyYWNrO1xuICAgIC8vICAgICAvLyAgICAgY29uc29sZS5sb2codmlkZW9UcmFjayk7XG4gICAgLy8gICAgIC8vICAgICBpZiAodmlkZW9UcmFjayA9PT0gbnVsbCkgcmV0dXJuIHRoaXMuY2xlYW51cFJlbW90ZVBhcnRpY2lwYW50KCk7XG5cbiAgICAvLyAgICAgLy8gICAgIHZpZGVvVHJhY2sucmVtb3ZlUmVuZGVyZXIodGhpcy52aWRlb0FjdGl2aXR5LnJlbW90ZVZpZGVvVmlldyk7XG4gICAgICAgICAgICBcblxuXG4gICAgLy8gICAgIHRoaXMudmlkZW9BY3Rpdml0eS5yZW1vdGVQYXJ0aWNpcGFudHMgPSB1bmRlZmluZWQ7XG4gICAgLy8gICAgIC8vIH1cbiAgICAvLyB9XG5cbiAgICBhZGRfcmVtb3RlX3ZpZXcoYyk6IHZvaWQge1xuICAgICAgICB0aGlzLnJlbW90ZVZpZGVvID0gbmV3IFJlbW90ZVZpZGVvKCk7XG4gICAgICAgIHRoaXMudmlkZW9BY3Rpdml0eS5yZW1vdGVWaWRlb1ZpZXcgPSB0aGlzLnJlbW90ZVZpZGVvLnJlbW90ZVZpZGVvVmlldztcbiAgICAgICAgdGhpcy5yZW1vdGVWaWRlby5jbGFzc05hbWUgPSAnYm94JztcbiAgICAgICAgYy5pbnNlcnRDaGlsZCh0aGlzLnJlbW90ZVZpZGVvLCAxKTtcbiAgICB9XG5cblxuICAgIGNoZWNrX3Blcm1pc3Npb25zKCk6IGJvb2xlYW4ge1xuICAgICAgICB2YXIgYXVkaW8sIGNhbWVyYTtcblxuICAgICAgICBpZiAoYXBwLmFuZHJvaWQpIHtcbiAgICAgICAgICAgIGF1ZGlvID0gcGVybWlzc2lvbnMuaGFzUGVybWlzc2lvbihcImFuZHJvaWQucGVybWlzc2lvbi5SRUNPUkRfQVVESU9cIikgICAgXG4gICAgICAgICAgICBjYW1lcmEgPSBwZXJtaXNzaW9ucy5oYXNQZXJtaXNzaW9uKFwiYW5kcm9pZC5wZXJtaXNzaW9uLkNBTUVSQVwiKSBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbWVyYSA9IEFWQ2FwdHVyZURldmljZS5hdXRob3JpemF0aW9uU3RhdHVzRm9yTWVkaWFUeXBlKEFWTWVkaWFUeXBlVmlkZW8pO1xuICAgICAgICAgICAgYXVkaW8gPSBBVkNhcHR1cmVEZXZpY2UuYXV0aG9yaXphdGlvblN0YXR1c0Zvck1lZGlhVHlwZShBVk1lZGlhVHlwZUF1ZGlvKTtcbiAgICAgICAgICAgIGlmIChjYW1lcmEgPCAzKSBjYW1lcmEgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChhdWRpbyA8IDMpIGF1ZGlvID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWF1ZGlvIHx8ICFjYW1lcmEpIHJldHVybiBmYWxzZTtcbiAgICAgICAgZWxzZSByZXR1cm4gdHJ1ZTtcblxuICAgIH1cblxuICAgIGdldFBlcm1pc3Npb25zKCk6IFByb21pc2U8YW55PiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGhhc19wZXJtaXNzaW9ucyA9IHRoaXMuY2hlY2tfcGVybWlzc2lvbnMoKTtcblxuICAgICAgICAgICAgaWYgKGhhc19wZXJtaXNzaW9ucykge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhcHAuYW5kcm9pZCkge1xuICAgICAgICAgICAgICAgIHBlcm1pc3Npb25zLnJlcXVlc3RQZXJtaXNzaW9ucyhbXG4gICAgICAgICAgICAgICAgICAgIFwiYW5kcm9pZC5wZXJtaXNzaW9uLlJFQ09SRF9BVURJT1wiLFxuICAgICAgICAgICAgICAgICAgICBcImFuZHJvaWQucGVybWlzc2lvbi5DQU1FUkFcIlxuICAgICAgICAgICAgICAgIF0sIFwiSSBuZWVkIHRoZXNlIHBlcm1pc3Npb25zIGJlY2F1c2UgSSdtIGNvb2xcIilcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRpcihyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRpcihlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVWggb2gsIG5vIHBlcm1pc3Npb25zIC0gcGxhbiBCIHRpbWUhXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhhc19wZXJtaXNzaW9ucyA9IHRoaXMuY2hlY2tfcGVybWlzc2lvbnMoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNfcGVybWlzc2lvbnMpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpYWxvZ3MuYWxlcnQoXCJ3aXRob3V0IG1pYyBhbmQgY2FtZXJhIHBlcm1pc3Npb25zIFxcbiB5b3UgY2Fubm90IG1lZXQgcG90ZW50aWFsIG1hdGNoZXMgdGhyb3VnaCB2aWRlbyBjaGF0LiBcXG4gcGxlYXNlIGFsbG93IHBlcm1pc3Npb25zIGluIHNldHRpbmdzIGFuZCB0cnkgYWdhaW4uXCIpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwoW3RoaXMuaW9zX21pY19wZXJtaXNzaW9uKCksIHRoaXMuaW9zX2NhbWVyYV9wZXJtaXNzaW9uKCldKVxuICAgICAgICAgICAgICAgICAgICAudGhlbih2YWx1ZXMgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodmFsdWVzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0scmVhc29uID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlYXNvbikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoJ2Vycm9yJywgcmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlhbG9ncy5hbGVydChcIndpdGhvdXQgbWljIGFuZCBjYW1lcmEgcGVybWlzc2lvbnMgXFxuIHlvdSBjYW5ub3QgbWVldCBwb3RlbnRpYWwgbWF0Y2hlcyB0aHJvdWdoIHZpZGVvIGNoYXQuIFxcbiBwbGVhc2UgYWxsb3cgcGVybWlzc2lvbnMgaW4gc2V0dGluZ3MgYW5kIHRyeSBhZ2Fpbi5cIikudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFVJQXBwbGljYXRpb24uc2hhcmVkQXBwbGljYXRpb24ub3BlblVSTChOU1VSTC5VUkxXaXRoU3RyaW5nKFVJQXBwbGljYXRpb25PcGVuU2V0dGluZ3NVUkxTdHJpbmcpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCgpXG5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KVxuXG4gICAgfVxuXG4gICAgaW9zX21pY19wZXJtaXNzaW9uKCk6IFByb21pc2U8YW55PiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGhhc19hc2tlZCA9IEFWQ2FwdHVyZURldmljZS5hdXRob3JpemF0aW9uU3RhdHVzRm9yTWVkaWFUeXBlKEFWTWVkaWFUeXBlQXVkaW8pO1xuXG4gICAgICAgICAgICBpZiAoaGFzX2Fza2VkID09PSAyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KCdtaWMgcGVybWlzc2lvbiBkZW5pZWQnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIEFWQXVkaW9TZXNzaW9uLnNoYXJlZEluc3RhbmNlKCkucmVxdWVzdFJlY29yZFBlcm1pc3Npb24oKGJvb2wpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYm9vbCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGJvb2wpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlamVjdCgnbWljIHBlcm1pc3Npb24gZGVuaWVkJyk7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pXG5cbiAgICB9XG5cbiAgICBpb3NfY2FtZXJhX3Blcm1pc3Npb24oKTogUHJvbWlzZTxhbnk+IHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgaGFzX2Fza2VkID0gQVZDYXB0dXJlRGV2aWNlLmF1dGhvcml6YXRpb25TdGF0dXNGb3JNZWRpYVR5cGUoQVZNZWRpYVR5cGVWaWRlbyk7XG5cbiAgICAgICAgICAgIGlmIChoYXNfYXNrZWQgPT09IDIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoJ2NhbWVyYSBwZXJtaXNzaW9uIGRlbmllZCcpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgQVZDYXB0dXJlRGV2aWNlLnJlcXVlc3RBY2Nlc3NGb3JNZWRpYVR5cGVDb21wbGV0aW9uSGFuZGxlcihBVk1lZGlhVHlwZVZpZGVvLCAoYm9vbCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChib29sID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYm9vbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVqZWN0KCdjYW1lcmEgcGVybWlzc2lvbiBkZW5pZWQnKTtcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgIHB1YmxpYyBkaXNjb25uZWN0KCkge1xuXG4gICAgICAgIGlmICh0aGlzLnZpZGVvQWN0aXZpdHkucm9vbSkge1xuXG4gICAgICAgICAgICB0aGlzLnZpZGVvQWN0aXZpdHkuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgYWRkX3RpbWUoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUuZGlyKFRWSUNhbWVyYUNhcHR1cmVyLmFsbG9jKCkuaW5pdCgpLmluaXRXaXRoRnJhbWVEZWxlZ2F0ZSgpKTtcbiAgICB9XG5cblxuICAgIHB1YmxpYyB0b2dnbGVfbG9jYWxfYXVkaW8oKSB7XG5cbiAgICAgICAgdGhpcy52aWRlb0FjdGl2aXR5LnRvZ2dsZV9sb2NhbF9hdWRpbygpO1xuXG4gICAgfVxuXG5cbiAgICBwdWJsaWMgdG9nZ2xlX2xvY2FsX3ZpZGVvKCkge1xuXG4gICAgICAgIHRoaXMudmlkZW9BY3Rpdml0eS50b2dnbGVfbG9jYWxfdmlkZW8oKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBjb25uZWN0X3RvX3Jvb20oKTogdm9pZCB7ICAgIFxuICAgICAgICBcbiAgICAgICAgbGV0IHRleHQgPSB0aGlzLmdldCgndGV4dGZpZWxkJyk7XG5cbiAgICAgICAgdGhpcy52aWRlb0FjdGl2aXR5LmNvbm5lY3RfdG9fcm9vbSh0ZXh0KTtcblxuICAgIH1cblxuXG4gICAgcHVibGljIGdldFRva2VuKCk6IGFueSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdnZXRUb2tlbicpO1xuICAgICAgICBsZXQgdXNlciA9IHtcbiAgICAgICAgICAgIHVpZDogJydcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoYXBwLmFuZHJvaWQpIHtcbiAgICAgICAgICAgIHVzZXIudWlkID0gJ2FuZHJvaWQnXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1c2VyLnVpZCA9ICdpb3MnO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaHR0cC5yZXF1ZXN0KHtcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3VzLWNlbnRyYWwxLWZpcmViYXNlLWdvYmx1ci5jbG91ZGZ1bmN0aW9ucy5uZXQvZ2V0X3Rva2VuXCIsXG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxuICAgICAgICAgICAgY29udGVudDogSlNPTi5zdHJpbmdpZnkodXNlcilcbiAgICAgICAgfSk7XG5cblxuICAgIH1cblxuXG59Il19