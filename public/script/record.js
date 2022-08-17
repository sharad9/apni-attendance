import {
    db,
    ref,
    get,
    set
} from "../script/fbmodule.js";
let inputSize = 512;
let scoreThreshold = 0.5;
let labeledDescriptors = null;
let faceMatcher = null;
const getCurrentFaceDetectionNet = () => {
    return faceapi.nets.tinyFaceDetector
}
const isFaceDetectionModelLoaded = () => {
    return !!getCurrentFaceDetectionNet().params
}
const getFaceDetectorOptions = () => {
    return new faceapi.TinyFaceDetectorOptions({
        inputSize,
        scoreThreshold
    })
};
const setUpModels = async () => {
    if (!isFaceDetectionModelLoaded()) {
        await getCurrentFaceDetectionNet().load('../html/models')
    }
    await faceapi.loadFaceLandmarkModel('../html/models')
    await faceapi.loadFaceRecognitionModel('../html/models')
    const stream = await navigator.mediaDevices.getUserMedia({
        video: {}
    })
    const videoEl = document.getElementById('inputVideo');
    videoEl.srcObject = stream;
};


const removeLoader = () => {
    const exists = document.getElementById('spinner') || false;
    if (exists) {
        exists.remove();
    }
}
const showLoader = () => {
    const exists = document.getElementById('spinner') || false;
    if (exists) {
        exists.style.display = "inline-block";
    }
}

const attachDescriptorsAndFaceMatchers = (apiUserData, fetchedUserData) => {
    labeledDescriptors = Array(apiUserData).map(function (ld) {
        return {
            label: fetchedUserData.className + ' ' + fetchedUserData.rollNo,
            descriptors: ld.descriptors.map(function (d) {
                return Object.values(d)
            })
        }
    });
    faceMatcher = faceapi.FaceMatcher.fromJSON({
        distanceThreshold: 0.6,
        labeledDescriptors: labeledDescriptors
    });
};
const sendSweetAlert = async (title, icon, userAcceptingMessage) => {
    await Swal.fire({
        title: title,
        icon: icon,
        confirmButtonColor: '#256625',
        // cancelButtonColor: '#d33',
        confirmButtonText: userAcceptingMessage,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
    }).then((value) => {
        location.href = '../html/index.html';
    });
};
const collectDetails = async () => {
    const {
        value: formValues
    } = await Swal.fire({
        title: 'Your Details',
        html: '<label for="branch">Branch: </label> <input id="branch" name="branch" placeholder="Branch :" class="swal2-input">' +
            '<label for="section">Section: </label><input id="section" name="section" placeholder="Section :" class="swal2-input">' +
            '<label for="rollNo">RollNo: </label><input id="rollNo" name = "rollNo" placeholder="RollNo :" class="swal2-input">',
        focusConfirm: true,
        confirmButtonColor: '#256625',
        confirmButtonText: "Submit",
        showCancelButton: true,
        preConfirm: () => {
            return {
                branch: document.getElementById('branch').value.toUpperCase().replace(' ', ''),
                section: document.getElementById('section').value.toUpperCase().replace(' ', ''),
                rollNo: document.getElementById('rollNo').value.toUpperCase().replace(' ', ''),
            }
        }
    });
    const isValidData = (!/[^a-zA-Z]/.test(formValues.branch) && /^[0-9]+$/.test(formValues.section) && /^[0-9]+$/.test(formValues.rollNo)); 
   
    if (formValues.branch!='' && formValues.section != '' &&  formValues.rollNo !='' && isValidData) {

        return formValues;
    } else {
        await sendSweetAlert("Fill valid inputs only.", "info", "OK");

    }

};


window.enrollUser = function enrollUser() {
    Swal.fire({
        title: 'Enroll New Face',
        text: "Please be ready in front of camera. You would need to make some face expressions to enroll. Do not worry, we do not share your data.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#256625',
        // cancelButtonColor: '#d33',
        confirmButtonText: "I am Ready"
    }).then((result) => {
        if (result.value) {
            location.href = '../html/enroll.html'
        }
    })
}


window.markAttendance = async () => {
    window.flag = true;
    const userDetails = await collectDetails();
    if (userDetails) {
        showLoader();
    }

    const className = userDetails.branch + userDetails.section;

    const studentRef = ref(db, `enrollment/${className}/${userDetails.rollNo}/`);
    get(studentRef).then(async (studentSnapshot) => {

        if (studentSnapshot.exists()) {

            const teacherRef = ref(db, `attendance/${className}/${0}/`);

            get(teacherRef).then(async (teacherSnapshot) => {
                if (!teacherSnapshot.exists()) {

                    if (userDetails.rollNo != 0) {
                        removeLoader();
                        await sendSweetAlert('Wrong Attempt!\n Please!, Wait For Your Teacher', "info", "OK , I Will Wait.");

                    }

                }
            });


            await setUpModels();

            attachDescriptorsAndFaceMatchers(studentSnapshot.val(), {
                className: className,
                rollNo: userDetails.rollNo
            });

        } else {

            removeLoader();
            await sendSweetAlert('Wrong Attempt!\n You Are Not Registered', "error", "OK");


        }
    }).catch(async (error) => {
        removeLoader();
        error = error.toString().split(':');
        console.log(error);
        await sendSweetAlert(error.pop(), "info", "OK");

    });
};


const enrolledUser = async (rollNo) => {
    window.flag = false;
    await sendSweetAlert(rollNo + ' ! You are marked', 'success', "I confirm");

};

const setdataOnFirebase = async(data) => {
    set(ref(db, `attendance/${data.className}/${data.rollNo}/`), {
        time: data.time,
        latitude: data.cords.lat,
        longitude: data.cords.long,
        distance: data.distance
    })
        .then(async () => {
            if (window.flag == true) {
                await enrolledUser(data.rollNo);
            }
        })
        .catch((error) => {
            alert('Data not inserted, ' + error);
        });
}
const addNewUser =async (userDetails, time, lat, long) => {
    userDetails = userDetails.split(' ');

    const className = userDetails[0];
    const rollNo = userDetails[1];


    if (rollNo != "0") {
        const teacherRef = ref(db, `attendance/${className}/${0}/`);
        get(teacherRef).then(async(snapshot) => {
            const teacherData = snapshot.val();
            const distance = Math.round(getDistanceFromLatLonInKm(teacherData.latitude, teacherData.longitude, lat, long) * 100) * 10;
            const data = new Object();
            data.className = className;
            data.rollNo = rollNo;
            data.cords = {
                lat: lat,
                long: long
            };
            data.time = time;
            data.distance = distance;
            await setdataOnFirebase(data);
        }
        );
    }

    else {
        const data = new Object();
        data.className = className;
        data.rollNo = rollNo;
        data.cords = {
            lat: lat,
            long: long
        };
        data.time = time;
        data.distance = 0;
        await setdataOnFirebase(data);

    }
};
const markPosition = async (e) => {
    var options = {
        enableHighAccuracy: true,
        maximumAge: 0
    };
    const userDetails = e.detail;
    const date = new Date();
    const time = `${date.getHours()}:${date.getMinutes()} ${date.toDateString()}`; // or 'my-unique-title'
    new PNotify({
        type: 'success',
        text: 'Face Recognized'
    });

    async function error(err) {

        await Swal.fire({
            title: 'First,Turn On Your Location Then Prooceed',
            icon: 'info',
            confirmButtonColor: '#256625',
            // cancelButtonColor: '#d33',
            confirmButtonText: "OK , I Will Turn On.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
        }).then((result) => {
            navigator.geolocation.watchPosition(success, error, options);
        })
    }
    const success = async (pos) => {
        var crd = pos.coords;
        var long = crd.longitude;
        var lat = crd.latitude;
        removeLoader();
        await addNewUser(userDetails, time, lat, long);

        return;
    }



    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(success, error, options);
    } else {
        alert('location is not supported');
    }

};
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    var R = 6371; // Radius of the earth in kilometers
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in KM
    return d;
}
const deg2rad = (deg) => {
    return deg * (Math.PI / 180)
}
window.onPlay = async () => {
    let identified = false;
    const videoEl = $('#inputVideo').get(0)
    if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
        return setTimeout(() => onPlay())
    const options = getFaceDetectorOptions()
    const results = await faceapi.detectAllFaces(videoEl, options).withFaceLandmarks().withFaceDescriptors();
    const canvas = document.createElement('canvas');
    canvas.width = 0;
    canvas.height = 0;
    if (results) {
        const dims = faceapi.matchDimensions(canvas, videoEl, true)
        const resizedResults = faceapi.resizeResults(results, dims)
        resizedResults.forEach(({
            detection,
            descriptor
        }) => {
            let label = 'unknown'
            let boxColor = 'red'
            if (faceMatcher !== null) {
                label = faceMatcher.findBestMatch(descriptor).label
                if (label !== 'unknown') {
                    boxColor = 'green',
                        markPosition({
                            detail: label
                        });
                    identified = true;
                }
            }
            const options = {
                label,
                boxColor
            }
            const drawBox = new faceapi.draw.DrawBox(detection.box, options)
            drawBox.draw(canvas)
        })
    } else {
        // clear drawings when no detection
        const context = canvas.getContext('2d')
        context.clearRect(0, 0, canvas.width, canvas.height)
    }
    if (!identified) {
        setTimeout(() => onPlay())
    }
}
