import { db, ref, onValue } from "./fbmodule.js";

var code1=(className)=>{
return `
	<div class="panel-group" id="accordion">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
				<a type="button" href="#${className}"  class="btn btn-success btn-lg btn-block" data-toggle="collapse" data-parent="#accordion" value="Toggle Button">
						${className}
				</a>
				<button type="button" onclick="javascript:getUsersDataInCSV('${className}')"
						class="btn btn-outline-primary">Download</button>
				</h4>
			</div>
			<div id="${className}" class="panel-collapse collapse in">
				<div class="panel-body">
					<table class="table">

						<tr class="table-light" >
							<th>Roll no</button></th>
							<th>Distance</button></th>
							<th>Reporting Time</button> </th>
						</tr>

	`;
};

var code3=
`


			</table>
				</div>
			</div>
		</div>
	</div>
`;

const removeLoader = ()=>{
	document.getElementById("spinner").remove();
}

const attendanceRef = ref(db, `attendance/`);
onValue(attendanceRef, (snapshot) => {

	removeLoader();
	

	const classesList = snapshot.val();
	var code2=``;

	for (const [className, data] of Object.entries(classesList)) {
		for (const [rollNo,studentData] of Object.entries(data)) {
			


			if(parseInt(studentData.distance)<=10){
			
		code2 += `
            <tr class="table-light">
              <td >${rollNo}</td>
                <td >${studentData.distance} meters</td>
                <td >${studentData.time}</td>
            </tr>
            
            `;


			
			}
			
		}
		
		var code4 = code1(className) + code2 + code3;

		document.getElementById("accordionExample").innerHTML += code4;
		code2 = ``;
		
	}
	
	
	

});



