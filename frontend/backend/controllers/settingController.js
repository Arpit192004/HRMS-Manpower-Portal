const CompanySetting = require("../models/CompanySetting");
const createAuditLog = require("../utils/auditLog");

const getOrCreateSettings = async () => {
  let settings = await CompanySetting.findOne().populate("updatedBy", "name email role");

  if (!settings) {
    settings = await CompanySetting.create({});
  }

  return settings;
};

const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();

    res.json({
      success: true,
      settings: {
        companyName: settings.companyName,
        tagline: settings.tagline,
        logoUrl: settings.logoUrl,
        email: settings.email,
        phone: settings.phone,
        website: settings.website,
        address: settings.address,
        footerText: settings.footerText
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCompanySettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    next(error);
  }
};

const updateCompanySettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    const oldData = settings.toObject();

    const allowedFields = [
      "companyName",
      "tagline",
      "logoUrl",
      "email",
      "phone",
      "website",
      "address",
      "gstNumber",
      "cinNumber",
      "footerText"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    settings.updatedBy = req.user._id;
    await settings.save();

    await createAuditLog({
      entityType: "CompanySetting",
      entityId: settings._id,
      action: "Update",
      oldData,
      newData: settings.toObject(),
      updatedBy: req.user._id
    });

    res.json({
      success: true,
      message: "Company settings updated successfully",
      settings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicSettings,
  getCompanySettings,
  updateCompanySettings
};
