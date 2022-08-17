import { db, ref, set } from "../script/fbmodule.js";

let inputSize = 512;
let scoreThreshold = 0.5;
let userDetails = null;

let objExpressionDescriptors = {};
const available_expressions = ['happy'];

const getCurrentFaceDetectionNet =()=> {
  return faceapi.nets.tinyFaceDetector;
}

const isFaceDetectionModelLoaded =()=> {
  return !!getCurrentFaceDetectionNet().params;
}

const getFaceDetectorOptions =()=> {
  return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
}

const hasAllExpressions =()=> {
  return available_expressions.every(function (expression) {
    return objExpressionDescriptors.hasOwnProperty(expression);
  });
}
const removeLoader = () => {
  const exists = document.getElementById('spinner') || false;
  if (exists) {
    exists.remove();

  }
}
const showLoader = () => {
  const exists = document.getElementById('spinner') || false;
  console.log(exists);
  if (exists) {
    exists.style.display = "inline-block";
  }
}
document.addEventListener('expression_added', (e) => {
  document.getElementById('emotion-'+e.detail).className += ' fulfilled';
 


  if (hasAllExpressions())
    document.dispatchEvent(new CustomEvent('expressions_fulfilled', { detail: Object.values(objExpressionDescriptors) }));
});
const collectDetails = async () => {



  const { value: formValues } = await Swal.fire({
    title: 'Your Details',
    html:
      '<label for="branch">Branch: </label> <input id="branch" name="branch" placeholder="Branch :" class="swal2-input">' +
      '<label for="section">Section: </label><input id="section" name="section" placeholder="Section :" class="swal2-input">' +
      '<label for="rollNo">RollNo: </label><input id="rollNo" name = "rollNo" placeholder="RollNo :" class="swal2-input">' +
      '<label for="name">Name: </label><input id="name" name="name" placeholder="Name :" class="swal2-input">',
    focusConfirm: true,
    confirmButtonColor: '#256625',
    showCancelButton: true,
    confirmButtonText: "Submit",
    preConfirm: () => {
      return {
        branch: document.getElementById('branch').value.toUpperCase().replace(' ', ''),
        section: document.getElementById('section').value.toUpperCase().replace(' ', ''),
        rollNo: document.getElementById('rollNo').value.toUpperCase().replace(' ', ''),
        name: document.getElementById('name').value.toUpperCase(),


      }
    }

  })

  return formValues;

};
document.addEventListener('expressions_fulfilled', async(e) => {



    addNewUser(userDetails, e.detail);

  
});

const enrolledUser =(rollNo)=> {
  Swal.fire({
    title: rollNo+' ! Got Enrolled',
    text: "Thank You",
    icon: 'info',
    confirmButtonColor: '#256625',
    // cancelButtonColor: '#d33',
    confirmButtonText: "I confirm "
  }).then((result) => {
    if (result.value) {
      location.href = '../html/index.html';
    }
  }).catch((error) => {
    alert('Data not inserted' + error);
  });
}
const setFirebaseData = (className,rollNo,name,descriptors)=>{
  set(ref(db, `enrollment/${className}/${rollNo}/`), {
    name: name,
    descriptors: descriptors

  })
    .then(() => {
      removeLoader();
      enrolledUser(rollNo);

    })
    .catch((error) => {
      alert(error);
    })
}

const addNewUser =(userDetails, descriptors)=> {
  
  const className = userDetails.branch + userDetails.section;
  setFirebaseData(className,userDetails.rollNo,userDetails.name,descriptors);

}

window.onPlay = async function onPlay() {
  const videoEl = document.getElementById('inputVideo');

  if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
    return setTimeout(() => onPlay())


  const options = getFaceDetectorOptions()

  const result = await faceapi.detectSingleFace(videoEl, options).withFaceLandmarks().withFaceExpressions().withFaceDescriptor()

  const canvas = document.createElement('canvas');
  canvas.width = 0;
  canvas.height = 0;

  if (result) {
    const dims = faceapi.matchDimensions(canvas, videoEl, true);

    const resizedResult = faceapi.resizeResults(result, dims);
    const minConfidence = 0.8;

    Object.keys(resizedResult.expressions).forEach(key => {

      if (available_expressions.indexOf(key) < 0) return

      if (resizedResult.expressions[key] > minConfidence)

        if (!objExpressionDescriptors.hasOwnProperty(key)) {

          objExpressionDescriptors[key] = resizedResult.descriptor;

          document.dispatchEvent(new CustomEvent('expression_added', { detail: key }))
        }
    });

    const label = 'new user'
    const options = { label: label, drawLines: false }
    const drawBox = new faceapi.draw.DrawBox(resizedResult.detection.box, options)
    drawBox.draw(canvas)
  } else {

    const context = canvas.getContext('2d')

    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  setTimeout(() => onPlay())
}


const setUpModels = async () => {

 
  if (!isFaceDetectionModelLoaded()) {
    await getCurrentFaceDetectionNet().load('../html/models');
  }
  await faceapi.loadFaceExpressionModel('../html/models');
  await faceapi.loadFaceLandmarkModel('../html/models');
  await faceapi.loadFaceRecognitionModel('../html/models');


  const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
  const videoEl = document.getElementById('inputVideo');
  videoEl.srcObject = stream;

}

window.startEnrollment = async () => { 
  userDetails = await collectDetails();
  if (userDetails){
    showLoader();
    setUpModels();
  }
 


};



