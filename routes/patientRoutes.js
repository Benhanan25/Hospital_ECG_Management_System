const express = require("express");

const Patient = require("../models/Patient");
const Visit = require("../models/Visit");
const ECG = require("../models/ECG");

const router = express.Router();

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();

    let age =
        today.getFullYear() -
        birthDate.getFullYear();

    const monthDifference =
        today.getMonth() -
        birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() < birthDate.getDate()
        )
    ) {
        age--;
    }

    return age;
}

router.get("/next-id", async (req, res) => {
    try {
        const patients = await Patient
            .find({})
            .select("patientId")
            .lean();

        let maxNumber = 0;

        patients.forEach((patient) => {
            const match = String(patient.patientId || "")
                .toUpperCase()
                .match(/^P(\d+)$/);

            if (match) {
                const number =
                    parseInt(match[1], 10);

                if (number > maxNumber) {
                    maxNumber = number;
                }
            }
        });

        const nextNumber = maxNumber + 1;

        const patientId =
            `P${String(nextNumber).padStart(3, "0")}`;

        res.json({
            patientId
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.get("/next-reference", async (req, res) => {
    try {
        const category =
            String(req.query.category || "")
                .trim()
                .toUpperCase();

        const prefixMap = {
            OPD: "OPD",
            WARD: "ADM",
            CLINIC: "CLN"
        };

        if (!prefixMap[category]) {
            return res.status(400).json({
                message:
                    "Invalid category. Please select OPD, Ward or Clinic."
            });
        }

        const prefix =
            prefixMap[category];

        const visits = await Visit
            .find({
                category: category
            })
            .select("referenceNo")
            .lean();

        let maxNumber = 0;

        visits.forEach((visit) => {
            const reference =
                String(
                    visit.referenceNo || ""
                ).toUpperCase();

            const match =
                reference.match(
                    new RegExp(
                        `^${prefix}(\\d+)$`
                    )
                );

            if (match) {
                const number =
                    parseInt(match[1], 10);

                if (number > maxNumber) {
                    maxNumber = number;
                }
            }
        });

        const nextNumber =
            maxNumber + 1;

        const referenceNo =
            `${prefix}${String(nextNumber).padStart(3, "0")}`;

        res.json({
            category,
            referenceNo
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.post("/check-duplicate", async (req, res) => {
    try {
        const {
            name,
            dob,
            gender
        } = req.body;

        if (!name || !dob || !gender) {
            return res.status(400).json({
                message:
                    "Name, DOB and gender are required."
            });
        }

        const patient =
            await Patient.findOne({
                name: name.trim(),
                dob: new Date(dob),
                gender
            }).lean();

        if (!patient) {
            return res.json({
                exists: false
            });
        }

        const visits =
            await Visit
                .find({
                    patientId:
                        patient.patientId
                })
                .sort({
                    createdAt: -1
                })
                .lean();

        res.json({
            exists: true,
            patient,
            visits
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const {
            patientId,
            name,
            dob,
            gender,
            address,
            phone,
            category,
            referenceNo,
            visitDate
        } = req.body;

        if (
            !patientId ||
            !name ||
            !dob ||
            !gender
        ) {
            return res.status(400).json({
                message:
                    "Patient ID, name, DOB and gender are required."
            });
        }

        const calculatedAge =
            calculateAge(dob);

        if (calculatedAge < 0) {
            return res.status(400).json({
                message:
                    "Date of birth cannot be in the future."
            });
        }

        const existingPatient =
            await Patient.findOne({
                name: name.trim(),
                dob: new Date(dob),
                gender
            });

        if (existingPatient) {
            return res.status(409).json({
                message:
                    `Patient already exists with Patient ID ${existingPatient.patientId}.`,
                patientId:
                    existingPatient.patientId
            });
        }

        const existingPatientId =
            await Patient.findOne({
                patientId:
                    patientId.trim().toUpperCase()
            });

        if (existingPatientId) {
            return res.status(409).json({
                message:
                    `Patient ID ${patientId} already exists.`
            });
        }

        if (category && !referenceNo) {
            return res.status(400).json({
                message:
                    "Reference number is required."
            });
        }

        if (referenceNo && !category) {
            return res.status(400).json({
                message:
                    "Category is required."
            });
        }

        let patient;

        try {
            patient =
                await Patient.create({
                    patientId:
                        patientId
                            .trim()
                            .toUpperCase(),

                    name:
                        name.trim(),

                    dob:
                        new Date(dob),

                    age:
                        calculatedAge,

                    gender,

                    address:
                        address
                            ? address.trim()
                            : "",

                    phone:
                        phone
                            ? phone.trim()
                            : ""
                });

        } catch (error) {

            if (error.code === 11000) {
                return res.status(409).json({
                    message:
                        "Patient ID already exists."
                });
            }

            throw error;
        }

        let visit = null;

        if (category && referenceNo) {

            try {

                visit =
                    await Visit.create({
                        patientId:
                            patient.patientId,

                        category:
                            category.toUpperCase(),

                        referenceNo:
                            referenceNo
                                .trim()
                                .toUpperCase(),

                        visitDate:
                            visitDate
                                ? new Date(visitDate)
                                : new Date()
                    });

            } catch (error) {

                await Patient.deleteOne({
                    patientId:
                        patient.patientId
                });

                if (error.code === 11000) {
                    return res.status(409).json({
                        message:
                            "Reference number already exists."
                    });
                }

                throw error;
            }
        }

        res.status(201).json({
            message:
                "Patient registered successfully.",

            patient,

            visit
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
});

router.get("/", async (req, res) => {
    try {

        const patients =
            await Patient
                .find({})
                .sort({
                    createdAt: -1
                })
                .lean();

        res.json(patients);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
});

router.get("/search", async (req, res) => {
    try {

        const {
            patientId,
            name,
            dob,
            gender,
            referenceNo
        } = req.query;

        const query = {};

        if (patientId) {
            query.patientId =
                patientId
                    .trim()
                    .toUpperCase();
        }

        if (name) {
            query.name = {
                $regex:
                    name.trim(),
                $options: "i"
            };
        }

        if (dob) {
            query.dob =
                new Date(dob);
        }

        if (gender) {
            query.gender =
                gender;
        }

        let patientIds = null;

        if (referenceNo) {
            const visits = await Visit.find({
                referenceNo: {
                    $regex: `^${referenceNo.trim()}$`,
                    $options: "i"
                }
            }).select("patientId").lean();

            patientIds = visits.map(visit => visit.patientId);

            if (!patientIds.length) {
                return res.json([]);
            }

            query.patientId = {
                $in: patientIds
            };
        }

        const patients =
            await Patient
                .find(query)
                .sort({
                    name: 1
                })
                .lean();

        const results = [];

        for (const patient of patients) {

            const visits =
                await Visit
                    .find({
                        patientId:
                            patient.patientId
                    })
                    .sort({
                        createdAt: -1
                    })
                    .lean();

            const ecgs =
                await ECG
                    .find({
                        patientId:
                            patient.patientId
                    })
                    .sort({
                        ecgDate: -1
                    })
                    .lean();

            results.push({
                ...patient,
                visits,
                ecgs
            });
        }

        res.json(results);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
});

router.get("/:patientId", async (req, res) => {
    try {

        const patientId =
            req.params.patientId
                .trim()
                .toUpperCase();

        const patient =
            await Patient
                .findOne({
                    patientId
                })
                .lean();

        if (!patient) {
            return res.status(404).json({
                message:
                    "Patient not found."
            });
        }

        const visits =
            await Visit
                .find({
                    patientId
                })
                .sort({
                    createdAt: -1
                })
                .lean();

        const ecgs =
            await ECG
                .find({
                    patientId
                })
                .sort({
                    ecgDate: -1
                })
                .lean();

        res.json({
            patient,
            visits,
            ecgs
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
});

router.post(
    "/:patientId/visits",
    async (req, res) => {

        try {

            const patientId =
                req.params.patientId
                    .trim()
                    .toUpperCase();

            const patient =
                await Patient.findOne({
                    patientId
                });

            if (!patient) {
                return res.status(404).json({
                    message:
                        "Patient not found."
                });
            }

            const {
                category,
                referenceNo,
                visitDate
            } = req.body;

            if (
                !category ||
                !referenceNo
            ) {
                return res.status(400).json({
                    message:
                        "Category and reference number are required."
                });
            }

            const visit =
                await Visit.create({
                    patientId,

                    category:
                        category
                            .trim()
                            .toUpperCase(),

                    referenceNo:
                        referenceNo
                            .trim()
                            .toUpperCase(),

                    visitDate:
                        visitDate
                            ? new Date(visitDate)
                            : new Date()
                });

            res.status(201).json({
                message:
                    "Visit added successfully.",

                visit
            });

        } catch (error) {

            if (error.code === 11000) {
                return res.status(409).json({
                    message:
                        "Reference number already exists."
                });
            }

            res.status(500).json({
                message: error.message
            });
        }
    }
);

router.delete(
    "/:patientId",
    async (req, res) => {

        try {

            const patientId =
                req.params.patientId
                    .trim()
                    .toUpperCase();

            const patient =
                await Patient.findOneAndDelete({
                    patientId
                });

            if (!patient) {
                return res.status(404).json({
                    message:
                        "Patient not found."
                });
            }

            await Visit.deleteMany({
                patientId
            });

            await ECG.deleteMany({
                patientId
            });

            res.json({
                message:
                    "Patient and related records deleted."
            });

        } catch (error) {

            res.status(500).json({
                message: error.message
            });
        }
    }
);

module.exports = router;