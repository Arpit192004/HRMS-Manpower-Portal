const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const toSkillSet = (skills = []) => {
  const values = Array.isArray(skills) ? skills : String(skills || "").split(",");
  return new Set(values.flatMap((skill) => normalize(skill)));
};

const calculateCandidateMatch = (candidate, job) => {
  const jobSkills = toSkillSet(job.skills || []);
  const candidateSkills = toSkillSet(candidate.skills || []);

  const matchedSkills = [...jobSkills].filter((skill) => candidateSkills.has(skill));
  const missingSkills = [...jobSkills].filter((skill) => !candidateSkills.has(skill));

  const skillScore = jobSkills.size
    ? Math.round((matchedSkills.length / jobSkills.size) * 45)
    : 25;

  const candidateExperience = Number(candidate.totalExperience || 0);
  const minExperience = Number(job.experience?.minimum || 0);
  const maxExperience = Number(job.experience?.maximum || minExperience || 0);

  let experienceScore = 0;
  if (candidateExperience >= minExperience && candidateExperience <= Math.max(maxExperience, minExperience)) {
    experienceScore = 25;
  } else if (candidateExperience >= minExperience) {
    experienceScore = 18;
  } else if (candidateExperience > 0 && minExperience > 0) {
    experienceScore = Math.round((candidateExperience / minExperience) * 18);
  }

  const expectedSalary = Number(candidate.expectedSalary || 0);
  const maxSalary = Number(job.salaryRange?.maximum || 0);
  const minSalary = Number(job.salaryRange?.minimum || 0);

  let salaryScore = 15;
  if (expectedSalary && maxSalary && expectedSalary > maxSalary) {
    salaryScore = 6;
  } else if (expectedSalary && minSalary && expectedSalary < minSalary) {
    salaryScore = 12;
  }

  const profileScore = [
    candidate.phone,
    candidate.resumeUrl,
    candidate.noticePeriod,
    candidate.currentDesignation,
    candidate.currentCompany
  ].filter(Boolean).length * 3;

  const score = Math.min(100, skillScore + experienceScore + salaryScore + profileScore);

  let recommendation = "Review";
  if (score >= 80) recommendation = "Strong Match";
  else if (score >= 60) recommendation = "Good Match";
  else if (score < 40) recommendation = "Weak Match";

  return {
    score,
    recommendation,
    matchedSkills,
    missingSkills,
    breakdown: {
      skills: skillScore,
      experience: experienceScore,
      salary: salaryScore,
      profile: profileScore
    },
    summary: `${matchedSkills.length}/${jobSkills.size || 0} required skills matched`
  };
};

module.exports = calculateCandidateMatch;
