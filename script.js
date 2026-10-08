// ==========================================
// STUDENT RESULT MANAGEMENT SYSTEM
// ==========================================


// Get form
const studentForm = document.getElementById("studentForm");

// Get error message element
const errorMessage = document.getElementById("errorMessage");

// Subject information
const subjects = [
    {
        name: "Mathematics",
        id: "math"
    },
    {
        name: "DSA",
        id: "dsa"
    },
    {
        name: "DBMS",
        id: "dbms"
    },
    {
        name: "Full Stack",
        id: "fullstack"
    },
    {
        name: "Agentic AI",
        id: "agenticai"
    }
];


// ==========================================
// FORM SUBMISSION
// ==========================================

studentForm.addEventListener("submit", function(event) {

    // Prevent page refresh
    event.preventDefault();

    errorMessage.textContent = "";


    // ======================================
    // GET STUDENT DETAILS
    // ======================================

    const name = document.getElementById("name").value.trim();

    const roll = document.getElementById("roll").value.trim();

    const semester =
        document.getElementById("semester").value;


    // ======================================
    // VALIDATE NAME
    // ======================================

    if (name === "") {

        errorMessage.textContent =
            "Please enter the student's name.";

        return;
    }


    // ======================================
    // VALIDATE ROLL NUMBER
    // ======================================

    if (roll === "" || Number(roll) <= 0) {

        errorMessage.textContent =
            "Please enter a valid roll number.";

        return;
    }


    // ======================================
    // GET MARKS
    // ======================================

    let marks = {};

    let validationFailed = false;


    subjects.forEach(function(subject) {

        const value =
            Number(document.getElementById(subject.id).value);

        marks[subject.id] = value;


        // Validate marks
        if (
            document.getElementById(subject.id).value === "" ||
            value < 0 ||
            value > 100
        ) {

            validationFailed = true;
        }

    });


    // ======================================
    // MARK VALIDATION
    // ======================================

    if (validationFailed) {

        errorMessage.textContent =
            "Marks must be between 0 and 100 for every subject.";

        return;
    }


    // ======================================
    // CALCULATE TOTAL
    // ======================================

    const total =
        marks.math +
        marks.dsa +
        marks.dbms +
        marks.fullstack +
        marks.agenticai;


    // ======================================
    // CALCULATE PERCENTAGE
    // ======================================

    const percentage = (total / 500) * 100;


    // ======================================
    // PASS / FAIL
    // ======================================

    // Minimum 40 marks required in every subject
    const passed = subjects.every(function(subject) {

        return marks[subject.id] >= 40;

    });


    const result = passed ? "PASS" : "FAIL";


    // ======================================
    // CREATE STUDENT OBJECT
    // ======================================

    const student = {

        name: name,

        rollNumber: Number(roll),

        semester: semester,

        subjects: {

            mathematics: marks.math,

            dsa: marks.dsa,

            dbms: marks.dbms,

            fullStack: marks.fullstack,

            agenticAI: marks.agenticai
        },

        totalMarks: total,

        maximumMarks: 500,

        percentage: percentage.toFixed(2),

        result: result
    };


    // ======================================
    // DISPLAY RESULT
    // ======================================

    displayResult(student);


    // ======================================
    // CONVERT OBJECT TO JSON
    // ======================================

    const jsonData =
        JSON.stringify(student, null, 4);


    document.getElementById("jsonOutput").textContent =
        jsonData;


    // ======================================
    // STORE IN LOCAL STORAGE
    // ======================================

    localStorage.setItem(
        "studentResult",
        jsonData
    );


    document.getElementById("storageMessage").textContent =
        "✓ Student data successfully stored in Local Storage.";

});


// ==========================================
// DISPLAY RESULT FUNCTION
// ==========================================

function displayResult(student) {

    // Student information

    document.getElementById("resultName").textContent =
        student.name;

    document.getElementById("resultRoll").textContent =
        student.rollNumber;

    document.getElementById("resultSemester").textContent =
        student.semester;


    // ======================================
    // TABLE
    // ======================================

    const resultTable =
        document.getElementById("resultTable");

    resultTable.innerHTML = "";


    const subjectMarks = [
        {
            name: "Mathematics",
            marks: student.subjects.mathematics
        },
        {
            name: "DSA",
            marks: student.subjects.dsa
        },
        {
            name: "DBMS",
            marks: student.subjects.dbms
        },
        {
            name: "Full Stack",
            marks: student.subjects.fullStack
        },
        {
            name: "Agentic AI",
            marks: student.subjects.agenticAI
        }
    ];


    subjectMarks.forEach(function(subject) {

        const row = document.createElement("tr");

        const subjectCell =
            document.createElement("td");

        subjectCell.textContent =
            subject.name;


        const marksCell =
            document.createElement("td");

        marksCell.textContent =
            subject.marks;


        const resultCell =
            document.createElement("td");


        if (subject.marks >= 40) {

            resultCell.textContent = "Pass";

            resultCell.classList.add("pass-text");

        } else {

            resultCell.textContent = "Fail";

            resultCell.classList.add("fail-text");

        }


        row.appendChild(subjectCell);

        row.appendChild(marksCell);

        row.appendChild(resultCell);

        resultTable.appendChild(row);

    });


    // ======================================
    // SUMMARY
    // ======================================

    document.getElementById("totalMarks").textContent =
        `${student.totalMarks} / ${student.maximumMarks}`;


    document.getElementById("percentage").textContent =
        `${student.percentage}%`;


    document.getElementById("finalResult").textContent =
        student.result;


    // ======================================
    // STATUS BADGE
    // ======================================

    const statusBadge =
        document.getElementById("statusBadge");

    statusBadge.textContent =
        student.result;


    if (student.result === "PASS") {

        statusBadge.style.color = "#4ade80";
        statusBadge.style.background = "#12301f";

    } else {

        statusBadge.style.color = "#f87171";
        statusBadge.style.background = "#351719";

    }

}


// ==========================================
// RESET FORM
// ==========================================

studentForm.addEventListener("reset", function() {

    errorMessage.textContent = "";

    document.getElementById("resultName").textContent = "-";

    document.getElementById("resultRoll").textContent = "-";

    document.getElementById("resultSemester").textContent = "-";

    document.getElementById("resultTable").innerHTML = "";

    document.getElementById("totalMarks").textContent =
        "0 / 500";

    document.getElementById("percentage").textContent =
        "0%";

    document.getElementById("finalResult").textContent =
        "-";

    document.getElementById("statusBadge").textContent =
        "-";

    document.getElementById("statusBadge").style.color =
        "";

    document.getElementById("statusBadge").style.background =
        "";

    document.getElementById("jsonOutput").textContent =
        "No data generated yet.";

    document.getElementById("storageMessage").textContent =
        "Data will be stored in Local Storage.";

});


// ==========================================
// LOAD SAVED DATA FROM LOCAL STORAGE
// ==========================================

window.addEventListener("load", function() {

    const savedData =
        localStorage.getItem("studentResult");


    if (savedData) {

        try {

            const student =
                JSON.parse(savedData);


            // Display saved result
            displayResult(student);


            // Display JSON
            document.getElementById("jsonOutput").textContent =
                JSON.stringify(student, null, 4);


            // Fill form again
            document.getElementById("name").value =
                student.name;

            document.getElementById("roll").value =
                student.rollNumber;


            document.getElementById("math").value =
                student.subjects.mathematics;

            document.getElementById("dsa").value =
                student.subjects.dsa;

            document.getElementById("dbms").value =
                student.subjects.dbms;

            document.getElementById("fullstack").value =
                student.subjects.fullStack;

            document.getElementById("agenticai").value =
                student.subjects.agenticAI;


            document.getElementById("storageMessage").textContent =
                "✓ Previous student data loaded from Local Storage.";

        }

        catch (error) {

            console.log(
                "Unable to load saved data."
            );

        }
    }

    });