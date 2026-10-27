const API = "/api";

const $ = (id) => document.getElementById(id);

const msg = (id, text, type = "") => {
    const element = $(id);
    if (!element) return;

    element.textContent = text;
    element.className = `message ${type}`;
};

const esc = (value) => {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

const date = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
};

async function api(url, options = {}) {
    const response = await fetch(url, options);

    const data = await response
        .json()
        .catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || "Request failed"
        );
    }

    return data;
}

function localDateTime() {
    const d = new Date();

    const pad = (number) => {
        return String(number).padStart(2, "0");
    };

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ageFromDOB(value) {
    if (!value) return "";

    const birth = new Date(value);
    const today = new Date();

    let age =
        today.getFullYear() -
        birth.getFullYear();

    const month =
        today.getMonth() -
        birth.getMonth();

    if (
        month < 0 ||
        (
            month === 0 &&
            today.getDate() < birth.getDate()
        )
    ) {
        age--;
    }

    return age >= 0 ? age : "";
}

async function nextId() {
    try {
        const data = await api(
            `${API}/patients/next-id`
        );

        $("patientId").value = data.patientId;
    } catch (error) {
        msg(
            "registerMessage",
            error.message,
            "error"
        );
    }
}

async function nextReference() {
    const category = $("category").value;

    if (!category) {
        $("referenceNo").value = "";

        msg(
            "registerMessage",
            "Please select OPD, Ward or Clinic first.",
            "error"
        );

        return;
    }

    try {
        const data = await api(
            `${API}/patients/next-reference?category=${category}`
        );

        $("referenceNo").value =
            data.referenceNo;

        msg(
            "registerMessage",
            "",
            ""
        );

    } catch (error) {
        msg(
            "registerMessage",
            error.message,
            "error"
        );
    }
}

function showApp() {
    $("loginPage").classList.add("hidden");
    $("app").classList.remove("hidden");

    nextId();
    loadDashboard();
}

function login() {
    sessionStorage.setItem(
        "loggedIn",
        "1"
    );

    showApp();
}

$("loginForm").addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        try {

            await api(
                `${API}/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        username:
                            $("username").value,
                        password:
                            $("password").value
                    })
                }
            );

            msg(
                "loginMessage",
                "Login successful.",
                "success"
            );

            login();

        } catch (error) {

            msg(
                "loginMessage",
                error.message,
                "error"
            );
        }
    }
);

function showLoginBox(box) {
    $("loginForm").classList.toggle("hidden", box !== "login");
    $("registerAccountBox").classList.toggle("hidden", box !== "register");
    $("forgotPasswordBox").classList.toggle("hidden", box !== "forgot");
    $("loginMessage").textContent = "";
}

$("showRegisterAccount").addEventListener(
    "click",
    () => showLoginBox("register")
);

$("showForgotPassword").addEventListener(
    "click",
    () => showLoginBox("forgot")
);

$("backToLoginFromRegister").addEventListener(
    "click",
    () => showLoginBox("login")
);

$("backToLoginFromForgot").addEventListener(
    "click",
    () => showLoginBox("login")
);

$("registerAccountForm").addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        try {
            const result = await api(
                `${API}/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: $("accountName").value.trim(),
                        username: $("accountUsername").value.trim(),
                        email: $("accountEmail").value.trim(),
                        password: $("accountPassword").value,
                        confirmPassword: $("accountConfirmPassword").value
                    })
                }
            );

            msg(
                "registerAccountMessage",
                result.message,
                "success"
            );

            $("registerAccountForm").reset();

            setTimeout(() => {
                showLoginBox("login");
            }, 800);
        } catch (error) {
            msg(
                "registerAccountMessage",
                error.message,
                "error"
            );
        }
    }
);

$("forgotPasswordForm").addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        try {
            const result = await api(
                `${API}/auth/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: $("forgotUsername").value.trim(),
                        email: $("forgotEmail").value.trim(),
                        newPassword: $("newPassword").value,
                        confirmPassword: $("confirmNewPassword").value
                    })
                }
            );

            msg(
                "forgotPasswordMessage",
                result.message,
                "success"
            );

            $("forgotPasswordForm").reset();

            setTimeout(() => {
                showLoginBox("login");
            }, 1000);
        } catch (error) {
            msg(
                "forgotPasswordMessage",
                error.message,
                "error"
            );
        }
    }
);

$("logoutBtn").addEventListener(
    "click",
    () => {

        sessionStorage.removeItem(
            "loggedIn"
        );

        location.reload();
    }
);

document
    .querySelectorAll(".tab")
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".tab")
                    .forEach((item) => {
                        item.classList.remove(
                            "active"
                        );
                    });

                document
                    .querySelectorAll(".section")
                    .forEach((section) => {
                        section.classList.add(
                            "hidden"
                        );
                    });

                button.classList.add(
                    "active"
                );

                const section =
                    $(button.dataset.section);

                if (section) {
                    section.classList.remove(
                        "hidden"
                    );
                }
            }
        );
    });

$("generateId").addEventListener(
    "click",
    nextId
);

$("generateReference").addEventListener(
    "click",
    nextReference
);

$("category").addEventListener(
    "change",
    async () => {

        $("referenceNo").value = "";

        if ($("category").value) {
            await nextReference();
        }
    }
);

$("dob").addEventListener(
    "change",
    () => {

        $("age").value =
            ageFromDOB(
                $("dob").value
            );
    }
);

$("visitDate").value =
    new Date()
        .toISOString()
        .slice(0, 10);

$("patientForm").addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const category =
            $("category").value;

        const referenceNo =
            $("referenceNo").value.trim();

        if (!category) {
            msg(
                "registerMessage",
                "Please select a category.",
                "error"
            );

            return;
        }

        if (!referenceNo) {
            msg(
                "registerMessage",
                "Please generate the reference number.",
                "error"
            );

            return;
        }

        const data = {
            patientId:
                $("patientId").value,

            name:
                $("patientName")
                    .value
                    .trim(),

            dob:
                $("dob").value,

            gender:
                $("gender").value,

            address:
                $("address").value.trim(),

            phone:
                $("phone").value.trim(),

            category:
                category,

            referenceNo:
                referenceNo,

            visitDate:
                $("visitDate").value
        };

        try {

            const duplicate =
                await api(
                    `${API}/patients/check-duplicate`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            name: data.name,
                            dob: data.dob,
                            gender: data.gender
                        })
                    }
                );

            if (duplicate.exists) {

                const visits =
                    duplicate.visits || [];

                const visitText =
                    visits.length
                        ? visits
                            .map(
                                (visit) =>
                                    `${visit.category}: ${visit.referenceNo}`
                            )
                            .join(", ")
                        : "";

                msg(
                    "registerMessage",
                    `Patient already exists. Patient ID: ${duplicate.patient.patientId}${visitText ? " | " + visitText : ""}`,
                    "error"
                );

                return;
            }

            const result =
                await api(
                    `${API}/patients`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body:
                            JSON.stringify(data)
                    }
                );

            msg(
                "registerMessage",
                `Patient ${result.patient.patientId} registered successfully.`,
                "success"
            );

            $("patientForm").reset();

            $("age").value = "";

            $("visitDate").value =
                new Date()
                    .toISOString()
                    .slice(0, 10);

            $("referenceNo").value = "";

            await nextId();

            await loadDashboard();

        } catch (error) {

            msg(
                "registerMessage",
                error.message,
                "error"
            );
        }
    }
);

async function loadDashboard() {

    try {

        const patients =
            await api(
                `${API}/patients`
            );

        $("totalPatients").textContent =
            patients.length;

        let opd = 0;
        let ward = 0;
        let clinic = 0;
        let totalECGs = 0;

        for (const patient of patients) {

            const details =
                await api(
                    `${API}/patients/${patient.patientId}`
                );

            const visits =
                details.visits || [];

            const ecgs =
                details.ecgs || [];

            const categories =
                visits.map(
                    (visit) =>
                        visit.category
                );

            if (
                categories.includes("OPD")
            ) {
                opd++;
            }

            if (
                categories.includes("WARD")
            ) {
                ward++;
            }

            if (
                categories.includes("CLINIC")
            ) {
                clinic++;
            }

            totalECGs += ecgs.length;
        }

        $("opdCount").textContent = opd;
        $("wardCount").textContent = ward;
        $("clinicCount").textContent = clinic;
        $("totalECGs").textContent = totalECGs;

        $("recentPatients").innerHTML =
            patients
                .slice(0, 10)
                .map(
                    (patient) => `
                        <tr>
                            <td>${esc(patient.patientId)}</td>
                            <td>${esc(patient.name)}</td>
                            <td>${date(patient.dob)}</td>
                            <td>${esc(patient.gender)}</td>
                            <td>
                                <button
                                    type="button"
                                    onclick="openPatient('${esc(patient.patientId)}')"
                                >
                                    View
                                </button>
                            </td>
                        </tr>
                    `
                )
                .join("");

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}

window.openPatient = async (
    patientId
) => {

    document
        .querySelector(
            '[data-section="search"]'
        )
        .click();

    $("searchPatientId").value =
        patientId;

    await search();
};

$("searchForm").addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        await search();
    }
);

$("refreshSearch").addEventListener(
    "click",
    async () => {
        $("searchForm").reset();
        $("searchResults").innerHTML = "";
        msg("searchMessage", "", "");
        await loadDashboard();
    }
);

async function search() {

    const params =
        new URLSearchParams();

    const fields = [
        [
            "searchPatientId",
            "patientId"
        ],
        [
            "searchName",
            "name"
        ],
        [
            "searchDob",
            "dob"
        ],
        [
            "searchGender",
            "gender"
        ],
        [
            "searchReferenceNo",
            "referenceNo"
        ]
    ];

    fields.forEach(
        ([elementId, parameter]) => {

            const value =
                $(elementId).value.trim();

            if (value) {
                params.set(
                    parameter,
                    value
                );
            }
        }
    );

    if (!params.toString()) {

        msg(
            "searchMessage",
            "Enter Patient ID, Name, DOB, Gender or Reference Number.",
            "error"
        );

        return;
    }

    try {

        const results =
            await api(
                `${API}/patients/search?${params.toString()}`
            );

        if (!results.length) {

            $("searchResults").innerHTML = "";

            msg(
                "searchMessage",
                "Patient not found.",
                "error"
            );

            return;
        }

        msg(
            "searchMessage",
            `${results.length} patient(s) found.`,
            "success"
        );

        $("searchResults").innerHTML =
            results
                .map(renderPatient)
                .join("");

    } catch (error) {

        msg(
            "searchMessage",
            error.message,
            "error"
        );
    }
}

function renderPatient(patient) {

    const visits =
        patient.visits || [];

    const ecgs =
        patient.ecgs || [];

    const visitHTML =
        visits.length
            ? visits
                .map(
                    (visit) => `
                        <span class="badge">
                            ${esc(visit.category)}
                            -
                            ${esc(visit.referenceNo)}
                        </span>
                    `
                )
                .join("")
            : "None";

    const ecgHTML =
        ecgs.length
            ? ecgs
                .map(
                    (ecg) => `
                        <tr>
                            <td>${date(ecg.ecgDate)}</td>
                            <td>${ecg.heartRate ?? "-"}</td>
                            <td>${ecg.prInterval ?? "-"}</td>
                            <td>${ecg.qrsDuration ?? "-"}</td>
                            <td>${ecg.qtInterval ?? "-"}</td>
                            <td>${esc(ecg.result || "-")}</td>
                            <td>
                                ${
                                    ecg.filePath
                                        ? `<a href="${ecg.filePath}" target="_blank">Open</a>`
                                        : "-"
                                }
                            </td>
                        </tr>
                    `
                )
                .join("")
            : `
                <tr>
                    <td colspan="7">
                        No ECG records found.
                    </td>
                </tr>
            `;

    return `
        <div class="patient">

            <h3>
                ${esc(patient.name)}
                <span class="badge">
                    ${esc(patient.patientId)}
                </span>
            </h3>

            <p>
                <strong>DOB:</strong>
                ${date(patient.dob)}
                |
                <strong>Age:</strong>
                ${patient.age}
                |
                <strong>Gender:</strong>
                ${esc(patient.gender)}
            </p>

            <p>
                <strong>Phone:</strong>
                ${esc(patient.phone || "-")}
                |
                <strong>Address:</strong>
                ${esc(patient.address || "-")}
            </p>

            <p>
                <strong>Visits:</strong>
                ${visitHTML}
            </p>

            <h4>
                ECG History
            </h4>

            <div class="table-wrap">

                <table>

                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>HR</th>
                            <th>PR</th>
                            <th>QRS</th>
                            <th>QT</th>
                            <th>Result</th>
                            <th>File</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${ecgHTML}
                    </tbody>

                </table>

            </div>

            <button
                type="button"
                onclick="loadECG('${esc(patient.patientId)}')"
            >
                Add ECG
            </button>

            <button
                type="button"
                class="danger"
                onclick="delPatient('${esc(patient.patientId)}')"
            >
                Delete
            </button>

        </div>
    `;
}

window.loadECG = async (
    patientId
) => {

    document
        .querySelector(
            '[data-section="ecg"]'
        )
        .click();

    $("ecgPatientId").value =
        patientId;

    await loadECGPatient(
        patientId
    );
};

window.delPatient = async (
    patientId
) => {

    const confirmed =
        confirm(
            "Delete patient and all related ECG records?"
        );

    if (!confirmed) {
        return;
    }

    try {

        await api(
            `${API}/patients/${patientId}`,
            {
                method: "DELETE"
            }
        );

        alert(
            "Patient deleted successfully."
        );

        await loadDashboard();

        if (
            $("searchPatientId").value
        ) {
            await search();
        }

    } catch (error) {

        alert(error.message);
    }
};

$("ecgSearch").addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const patientId =
            $("ecgPatientId")
                .value
                .trim();

        if (!patientId) {
            msg(
                "ecgPatientMessage",
                "Enter Patient ID.",
                "error"
            );

            return;
        }

        await loadECGPatient(
            patientId
        );
    }
);

async function loadECGPatient(
    patientId
) {

    try {

        const data =
            await api(
                `${API}/patients/${patientId.toUpperCase()}`
            );

        $("ecgPatientHidden").value =
            data.patient.patientId;

        $("ecgInfo").innerHTML = `
            <div class="patient">

                <h3>
                    ${esc(data.patient.name)}
                    (${esc(data.patient.patientId)})
                </h3>

                <p>
                    <strong>DOB:</strong>
                    ${date(data.patient.dob)}
                    |
                    <strong>Age:</strong>
                    ${data.patient.age}
                    |
                    <strong>Gender:</strong>
                    ${esc(data.patient.gender)}
                </p>

            </div>
        `;

        const visits =
            data.visits || [];

        if (!visits.length) {

            $("visitSelect").innerHTML = `
                <option value="">
                    No visit available
                </option>
            `;

            $("ecgCard").classList.add(
                "hidden"
            );

            msg(
                "ecgPatientMessage",
                "This patient has no visit. Please add a visit first.",
                "error"
            );

            return;
        }

        $("visitSelect").innerHTML =
            visits
                .map(
                    (visit) => `
                        <option value="${visit._id}">
                            ${esc(visit.category)}
                            -
                            ${esc(visit.referenceNo)}
                        </option>
                    `
                )
                .join("");

        $("ecgDate").value =
            localDateTime();

        $("ecgCard").classList.remove(
            "hidden"
        );

        msg(
            "ecgPatientMessage",
            "Patient loaded successfully.",
            "success"
        );

    } catch (error) {

        $("ecgCard").classList.add(
            "hidden"
        );

        msg(
            "ecgPatientMessage",
            error.message,
            "error"
        );
    }
}

$("ecgForm").addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const formData =
            new FormData();

        formData.append(
            "patientId",
            $("ecgPatientHidden").value
        );

        formData.append(
            "visitId",
            $("visitSelect").value
        );

        formData.append(
            "ecgDate",
            $("ecgDate").value
        );

        formData.append(
            "heartRate",
            $("heartRate").value
        );

        formData.append(
            "prInterval",
            $("prInterval").value
        );

        formData.append(
            "qrsDuration",
            $("qrsDuration").value
        );

        formData.append(
            "qtInterval",
            $("qtInterval").value
        );

        formData.append(
            "result",
            $("result").value
        );

        formData.append(
            "doctor",
            $("doctor").value
        );

        formData.append(
            "notes",
            $("notes").value
        );

        const file =
            $("ecgFile").files[0];

        if (file) {
            formData.append(
                "ecgFile",
                file
            );
        }

        try {

            const result =
                await api(
                    `${API}/ecg`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

            msg(
                "ecgMessage",
                result.message,
                "success"
            );

            const patientId =
                $("ecgPatientHidden").value;

            $("ecgForm").reset();

            $("ecgPatientHidden").value =
                patientId;

            $("ecgDate").value =
                localDateTime();

            await loadECGPatient(
                patientId
            );

            await loadDashboard();

        } catch (error) {

            msg(
                "ecgMessage",
                error.message,
                "error"
            );
        }
    }
);

if (
    sessionStorage.getItem(
        "loggedIn"
    ) === "1"
) {
    showApp();
}