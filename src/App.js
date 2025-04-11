import React, { useState, useEffect } from "react";
import "./index.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  DollarSign,
  TrendingUp,
  Clock,
  Wrench,
  CheckCircle,
  Camera,
  FileText,
  PieChart,
  Printer,
  Users,
  MapPin,
  SquareStack,
  Calendar,
} from "lucide-react";

const HPSitePrintROICalculator = () => {
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // State for current slide
  const [currentSlide, setCurrentSlide] = useState(1);

  // State for customer information (Slide 1)
  const [customerInfo, setCustomerInfo] = useState({
    companyName: "",
    contactName: "",
    zipCode: "",
    email: "",
    phone: "",
  });

  // State for analysis options (Slide 2)
  const [analysisOptions, setAnalysisOptions] = useState({
    analysisType: "project", // 'project' or 'company'
    layoutType: "line", // 'line' or 'point'
    measurementUnit: "squareFeet", // 'squareFeet' or 'linealFeet' (only if layoutType is 'line')
    ownershipModel: "fullKit", // 'fullKit', 'printerOnly', or 'rental'
  });

  // State for traditional info (Slide 2)
  const [traditionalInfo, setTraditionalInfo] = useState({
    workerCount: 2,
    hourlyRate: 65,
    productivity: 330, // Default for line/squareFeet
    projectSize: 10000, // sq ft or linear ft or points
    projectCount: 12, // for company analysis
    reworkPercentage: 10,
  });

  // State for HP SitePrint info (Slide 2)
  const [siteprintInfo, setSiteprintInfo] = useState({
    workerCount: 1,
    productivity: 3600, // Default for line/squareFeet
    initialInvestment: 81000, // Default for fullKit
    rentalCost: 0, // For rental option
    usageCost: 0, // Usage-based costs
    estimatedLayoutDays: 1, // Estimated number of days for layout
  });

  // State for ROI calculations (Slide 3)
  const [roiData, setRoiData] = useState({
    combinedData: [],
    comparisonData: [],
    traditionalLaborCost: 0,
    siteprintLaborCost: 0,
    productivityIncrease: 0,
    roi: 0,
    breakeven: 0,
    fiveYearROI: 0,
    timeSavings: 0,
    traditionalReworkCost: 0,
    siteprintReworkCost: 0,
    reworkSavings: 0,
    reworkPercentage: 10,
    traditionalLayoutDays: 0,
    siteprintLayoutDays: 0,
    traditionalManHours: 0,
    siteprintManHours: 0,
    traditionalUnitCost: 0,
    siteprintUnitCost: 0,
    uncappedUsageCost: 0,
    freePrinting: 0,
  });

  // State for benefit analysis (Slide 4)
  const [benefitData, setBenefitData] = useState({
    reductionRanges: {
      min: 25,
      max: 75,
    },
    selectedReduction: 50,
    reworkSavings: 0,
    communicationSavings: 0,
    scheduleSavings: 0,
    safetySavings: 0,
    competitiveValue: 0,
    // Initialize all checkboxes to true by default
    enabledBenefits: {
      communication: true,
      rework: true,
      schedule: true,
      safety: true,
      competitive: true,
    },
  });

  // Ownership model configurations
  const ownershipConfigurations = {
    fullKit: {
      name: "Full HP SitePrint Kit",
      cost: 81000,
    },
    printerOnly: {
      name: "HP SitePrint Only",
      cost: 50000,
    },
    rental: {
      name: "HP Rental",
      cost: 0,
      // Rental rates calculated dynamically based on estimated layout days
    },
  };

  // Productivity rates based on provided document
  const productivityRates = {
    line: {
      squareFeet: {
        traditional: 330, // sq ft per hour with 2-3 workers
        hp: 3600, // sq ft per hour with 1 worker
      },
      linealFeet: {
        traditional: 30, // linear ft per hour with 2-3 workers
        hp: 350, // linear ft per hour with 1 worker
      },
    },
    point: {
      traditional: 5, // points per hour with 2-3 workers
      traditionalRobotic: 38, // points per hour with 1 worker (robotic total station)
      hp: 200, // points per hour with 1 worker
    },
  };

  // Update investment cost and productivity when options change
  useEffect(() => {
    // Update investment based on ownership model
    const configCost =
      ownershipConfigurations[analysisOptions.ownershipModel].cost;

    // Calculate HP layout days estimate based on project size and productivity
    // This will be used for rental cost calculation but not shown to the user
    const estimatedLayoutHours =
      traditionalInfo.projectSize / siteprintInfo.productivity;
    const estimatedLayoutDays = Math.ceil(estimatedLayoutHours / 8); // Assuming 8 hour work days

    // Calculate rental cost based on estimated layout days
    let rentalCost = 0;
    if (analysisOptions.ownershipModel === "rental") {
      if (estimatedLayoutDays < 5) {
        rentalCost = 400 * estimatedLayoutDays;
      } else if (estimatedLayoutDays > 15) {
        rentalCost = 240 * estimatedLayoutDays;
      } else {
        rentalCost = 320 * estimatedLayoutDays;
      }
    }

    // Calculate HP usage cost
    let usageCost = 0;
    if (analysisOptions.layoutType === "point") {
      usageCost = 2 * traditionalInfo.projectSize;
    } else {
      // line layout
      usageCost = 0.2 * traditionalInfo.projectSize;
    }

    // Apply usage cost cap rules
    if (usageCost > 12000) {
      if (estimatedLayoutDays < 30) {
        usageCost = 12000; // Flat cap at $12K for less than 30 days
      } else {
        usageCost = (estimatedLayoutDays / 30) * 12000; // Prorated for 30+ days
      }
    }

    // Update productivity rates based on layout type and measurement unit
    let traditionalRate, hpRate;

    if (analysisOptions.layoutType === "line") {
      traditionalRate =
        productivityRates.line[analysisOptions.measurementUnit].traditional;
      hpRate = productivityRates.line[analysisOptions.measurementUnit].hp;
    } else {
      // point
      traditionalRate = productivityRates.point.traditional;
      hpRate = productivityRates.point.hp;
    }

    setTraditionalInfo((prev) => ({ ...prev, productivity: traditionalRate }));
    setSiteprintInfo((prev) => ({
      ...prev,
      initialInvestment: configCost,
      rentalCost: rentalCost,
      usageCost: usageCost,
      productivity: hpRate,
      estimatedLayoutDays: estimatedLayoutDays,
    }));
  }, [
    analysisOptions.ownershipModel,
    analysisOptions.layoutType,
    analysisOptions.measurementUnit,
    traditionalInfo.projectSize,
  ]);

  // Calculate ROI data when options or info changes
  useEffect(() => {
    if (currentSlide === 3) {
      calculateROI();
    }
  }, [currentSlide, traditionalInfo, siteprintInfo, analysisOptions]);

  // Calculate benefit analysis when needed
  useEffect(() => {
    if (currentSlide === 4) {
      calculateBenefitAnalysis();
    }
  }, [
    currentSlide,
    roiData,
    benefitData.selectedReduction,
    benefitData.enabledBenefits,
  ]);

  // Handle customer info changes
  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Handle traditional info changes
  const handleTraditionalInfoChange = (e) => {
    const { name, value } = e.target;
    setTraditionalInfo((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // Handle HP SitePrint info changes
  const handleSiteprintInfoChange = (e) => {
    const { name, value } = e.target;
    setSiteprintInfo((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // Handle analysis options changes
  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    // For numeric fields, parse the value
    if (name === "hpLayoutDays") {
      setAnalysisOptions((prev) => ({ ...prev, [name]: parseInt(value) || 1 }));
    } else {
      setAnalysisOptions((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle benefit reduction percentage change
  const handleReductionChange = (e) => {
    const value = parseInt(e.target.value);
    setBenefitData((prev) => ({ ...prev, selectedReduction: value }));
  };

  // Handle benefit toggle (checkbox) changes
  const handleBenefitToggle = (benefitName) => {
    setBenefitData((prev) => ({
      ...prev,
      enabledBenefits: {
        ...prev.enabledBenefits,
        [benefitName]: !prev.enabledBenefits[benefitName],
      },
    }));
  };

  // Function to send data to CRM API (placeholder)
  const sendDataToCRM = () => {
    const data = calculateROI(); // Calculate ROI first to ensure we have the values

    const roiDataObject = {
      CUSTOMER_INFORMATION: {
        Company_Name: customerInfo.companyName,
        Contact_Name: customerInfo.contactName,
        Zip_Code: customerInfo.zipCode,
        Email: customerInfo.email,
        Phone: customerInfo.phone || "Not provided",
      },
      Analysis_SETUP: {
        Analysis_Type: analysisOptions.analysisType,
        Layout_Type: analysisOptions.layoutType,
        Measurement_Unit: analysisOptions.measurementUnit,
        Ownership_Model: analysisOptions.ownershipModel,
        Project_Size: analysisOptions.projectSize,
      },
      TRADITIONAL_SETUP: {
        Number_of_Workers: traditionalInfo.workerCount,
        Hourly_Rate: `$${traditionalInfo.hourlyRate}`,
        Productivity_Rate: `${traditionalInfo.productivity}`,
        Typical_Rework_Percentage: `${traditionalInfo.reworkPercentage}`,
      },
      Generated_On: new Date().toLocaleString(),
    };

    // Convert the object to a properly formatted JSON string
    const roiDataText = JSON.stringify(roiDataObject);

    // Encode the JSON string for URL inclusion
    const encodedRoiData = encodeURIComponent(roiDataText);

    // Construct the full URL with the roidata parameter
    const apiUrl = `https://www.zohoapis.com/crm/v7/functions/rts_roi_v2026/actions/execute?auth_type=apikey&zapikey=1003.fbdcd3c87c9b3217f06707a5bdf03400.058c11de15744d85b481b76aa7b2f8bf&roidata=${encodedRoiData}`;

    // Create an image object to trigger the URL (this is a way to make a request without waiting for response)
    const img = new Image();
    img.src = apiUrl;

    // Move to the next slide immediately
    setCurrentSlide(currentSlide + 1);
  };

  // Navigate to next slide
  const nextSlide = () => {
    if (currentSlide < 4) {
      if (currentSlide === 2) {
        sendDataToCRM();
        return; // sendDataToZoho handles the navigation
      } else {
        setCurrentSlide(currentSlide + 1);

        if (currentSlide === 3) {
          calculateBenefitAnalysis();
        }
      }
    }
  };

  // Navigate to previous slide
  const prevSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Calculate ROI data
  const calculateROI = () => {
    // Determine project count based on analysis type
    const projectCount =
      analysisOptions.analysisType === "project"
        ? 1
        : traditionalInfo.projectCount;

    // Calculate hours needed for the project(s)
    const traditionalHours =
      (traditionalInfo.projectSize / traditionalInfo.productivity) *
      projectCount;
    const siteprintHours =
      (traditionalInfo.projectSize / siteprintInfo.productivity) * projectCount;

    // Calculate labor costs
    const traditionalLaborCost =
      traditionalHours *
      traditionalInfo.hourlyRate *
      traditionalInfo.workerCount;
    const siteprintLaborCost =
      siteprintHours * traditionalInfo.hourlyRate * siteprintInfo.workerCount;

    // Calculate usage cost
    let uncappedUsageCost = 0;
    let actualUsageCost = 0;

    if (analysisOptions.analysisType === "company") {
      // For company-wide ROI, calculate usage per project, apply cap, then multiply by project count
      let uncappedUsageCostPerProject = 0;
      if (analysisOptions.layoutType === "point") {
        uncappedUsageCostPerProject = 2 * traditionalInfo.projectSize;
      } else {
        // line layout
        uncappedUsageCostPerProject = 0.2 * traditionalInfo.projectSize;
      }

      // Apply cap to individual project
      let actualUsageCostPerProject = uncappedUsageCostPerProject;
      if (uncappedUsageCostPerProject > 12000) {
        if (siteprintInfo.estimatedLayoutDays < 30) {
          actualUsageCostPerProject = 12000;
        } else {
          actualUsageCostPerProject =
            (siteprintInfo.estimatedLayoutDays / 30) * 12000;
        }
      }

      // Multiply by project count
      uncappedUsageCost = uncappedUsageCostPerProject * projectCount;
      actualUsageCost = actualUsageCostPerProject * projectCount;
    } else {
      // For single project analysis, calculate as before
      if (analysisOptions.layoutType === "point") {
        uncappedUsageCost = 2 * traditionalInfo.projectSize;
      } else {
        // line layout
        uncappedUsageCost = 0.2 * traditionalInfo.projectSize;
      }

      // Get estimated layout days
      const estimatedLayoutDays = siteprintInfo.estimatedLayoutDays;

      // Apply cap
      actualUsageCost = uncappedUsageCost;
      if (actualUsageCost > 12000) {
        if (estimatedLayoutDays < 30) {
          actualUsageCost = 12000;
        } else {
          actualUsageCost = (estimatedLayoutDays / 30) * 12000;
        }
      }
    }

    // Calculate free printing amount (if any)
    const freePrinting =
      uncappedUsageCost > actualUsageCost
        ? uncappedUsageCost - actualUsageCost
        : 0;

    // Calculate rental cost for all projects based on estimated layout days
    let totalRentalCost = 0;
    if (analysisOptions.ownershipModel === "rental") {
      totalRentalCost = siteprintInfo.rentalCost * projectCount;
    }

    // Calculate total costs based on ownership model
    let siteprintTotalCost = siteprintLaborCost;
    let rentalTotalCost = 0;

    if (analysisOptions.ownershipModel === "rental") {
      // For rental, add the rental cost and usage cost
      siteprintTotalCost += totalRentalCost + actualUsageCost;
    } else {
      // For purchased equipment, include the amortized cost over 3 years (36 months)
      // and add the usage cost
      const annualAmortizedCost = siteprintInfo.initialInvestment / 3; // 3-year amortization
      siteprintTotalCost += annualAmortizedCost + actualUsageCost;

      // Calculate rental cost for comparison (if needed)
      // Use the same estimated layout days, but with rental pricing
      let rentalDailyCost = 0;
      if (siteprintInfo.estimatedLayoutDays < 5) {
        rentalDailyCost = 400;
      } else if (siteprintInfo.estimatedLayoutDays > 15) {
        rentalDailyCost = 240;
      } else {
        rentalDailyCost = 320;
      }
      const rentalCostPerProject =
        rentalDailyCost * siteprintInfo.estimatedLayoutDays;
      rentalTotalCost =
        siteprintLaborCost +
        rentalCostPerProject * projectCount +
        actualUsageCost;
    }

    // Calculate productivity increase (reduction in time)
    const productivityIncrease =
      ((traditionalHours - siteprintHours) / traditionalHours) * 100;

    // Calculate man-hours
    const traditionalManHours = traditionalHours * traditionalInfo.workerCount;
    const siteprintManHours = siteprintHours * siteprintInfo.workerCount;

    // Calculate cost per unit
    const traditionalUnitCost =
      traditionalLaborCost / (traditionalInfo.projectSize * projectCount);
    const siteprintUnitCost =
      siteprintTotalCost / (traditionalInfo.projectSize * projectCount);

    // Calculate layout days
    const hoursPerDay = 8; // Assuming 8-hour workdays
    const traditionalLayoutDays = Math.ceil(traditionalHours / hoursPerDay); // Don't divide by worker count since productivity is team-based
    const siteprintLayoutDays = Math.ceil(siteprintHours / hoursPerDay); // HP SitePrint uses 1 worker always

    // Calculate rework costs
    const traditionalReworkCost =
      traditionalLaborCost * (traditionalInfo.reworkPercentage / 100);
    const siteprintReworkCost = 0; // Set HP SitePrint rework cost to $0
    const reworkSavings = traditionalReworkCost - siteprintReworkCost;

    // Calculate ROI for purchased equipment
    let roi = 0;
    let breakeven = 0;
    let fiveYearROI = 0;

    if (analysisOptions.ownershipModel !== "rental") {
      const annualSavings =
        traditionalLaborCost -
        siteprintLaborCost +
        reworkSavings -
        actualUsageCost;
      roi = (annualSavings / siteprintInfo.initialInvestment) * 100;

      // Calculate breakeven point (in months)
      const monthlySavings = annualSavings / 12;
      breakeven =
        monthlySavings > 0
          ? siteprintInfo.initialInvestment / monthlySavings
          : 0;

      // Calculate 5-year ROI
      const fiveYearSavings = annualSavings * 5;
      fiveYearROI = (fiveYearSavings / siteprintInfo.initialInvestment) * 100;
    } else {
      // For rental, calculate savings per project
      const projectSavings =
        traditionalLaborCost -
        siteprintLaborCost -
        siteprintInfo.rentalCost * projectCount -
        actualUsageCost;
      roi =
        (projectSavings /
          (siteprintInfo.rentalCost * projectCount + actualUsageCost)) *
        100;
    }

    // Generate cost data for chart
    const monthlyData = [];
    const projectData = [];
    const months = 36; // 3 years
    const maxProjects = 24; // Maximum number of projects to show

    let traditionalCumulative = 0;
    let siteprintCumulative = 0;

    // Generate monthly data (for company analysis)
    for (let i = 1; i <= months; i++) {
      const monthlyTraditionalCost = traditionalLaborCost / 12;
      const monthlySiteprintLaborCost = siteprintLaborCost / 12;
      const monthlyTraditionalReworkCost = traditionalReworkCost / 12;
      const monthlySiteprintReworkCost = siteprintReworkCost / 12;

      traditionalCumulative +=
        monthlyTraditionalCost + monthlyTraditionalReworkCost;

      if (analysisOptions.ownershipModel !== "rental") {
        // For first month, add the full initial investment for company-wide analysis
        if (i === 1) {
          siteprintCumulative +=
            monthlySiteprintLaborCost +
            monthlySiteprintReworkCost +
            siteprintInfo.initialInvestment +
            siteprintInfo.usageCost;
        } else {
          siteprintCumulative +=
            monthlySiteprintLaborCost + monthlySiteprintReworkCost;
        }
      } else {
        // For rental, distribute costs evenly over months
        siteprintCumulative +=
          monthlySiteprintLaborCost +
          monthlySiteprintReworkCost +
          (siteprintInfo.rentalCost + siteprintInfo.usageCost) / 12;
      }

      monthlyData.push({
        period: `Month ${i}`,
        Traditional: traditionalCumulative,
        SitePrint: siteprintCumulative,
      });
    }

    // Reset for project data
    traditionalCumulative = 0;
    siteprintCumulative = 0;

    // Generate project data (for project analysis)
    const projectTraditionalCost = traditionalLaborCost / projectCount;
    const projectSiteprintLaborCost = siteprintLaborCost / projectCount;
    const projectUsageCost = actualUsageCost / projectCount;
    const projectTraditionalReworkCost = traditionalReworkCost / projectCount;
    const projectSiteprintReworkCost = siteprintReworkCost / projectCount;

    for (let i = 1; i <= maxProjects; i++) {
      traditionalCumulative +=
        projectTraditionalCost + projectTraditionalReworkCost;

      if (i === 1 && analysisOptions.ownershipModel !== "rental") {
        siteprintCumulative +=
          projectSiteprintLaborCost +
          siteprintInfo.initialInvestment +
          projectUsageCost +
          projectSiteprintReworkCost;
      } else if (analysisOptions.ownershipModel !== "rental") {
        siteprintCumulative +=
          projectSiteprintLaborCost +
          projectUsageCost +
          projectSiteprintReworkCost;
      } else {
        // For rental, add costs for each project
        siteprintCumulative +=
          projectSiteprintLaborCost +
          siteprintInfo.rentalCost +
          projectUsageCost +
          projectSiteprintReworkCost;
      }

      projectData.push({
        period: `Project ${i}`,
        Traditional: traditionalCumulative,
        SitePrint: siteprintCumulative,
      });
    }

    // Prepare comparison data for performance metrics
    const comparisonData = [
      {
        name: "Layout Duration (Days)",
        Traditional: traditionalLayoutDays,
        SitePrint: siteprintLayoutDays,
        improvement: (
          ((traditionalLayoutDays - siteprintLayoutDays) /
            traditionalLayoutDays) *
          100
        ).toFixed(1),
      },
      {
        name: "Layout Hours",
        Traditional: traditionalHours.toFixed(1),
        SitePrint: siteprintHours.toFixed(1),
        improvement: (
          ((traditionalHours - siteprintHours) / traditionalHours) *
          100
        ).toFixed(1),
      },
      {
        name: "Man-Hours",
        Traditional: traditionalManHours.toFixed(1),
        SitePrint: siteprintManHours.toFixed(1),
        improvement: (
          ((traditionalManHours - siteprintManHours) / traditionalManHours) *
          100
        ).toFixed(1),
      },
      {
        name:
          "Cost per " +
          (analysisOptions.layoutType === "line"
            ? analysisOptions.measurementUnit === "squareFeet"
              ? "sq ft"
              : "linear ft"
            : "point"),
        Traditional: traditionalUnitCost.toFixed(2),
        SitePrint: siteprintUnitCost.toFixed(2),
        improvement: (
          ((traditionalUnitCost - siteprintUnitCost) / traditionalUnitCost) *
          100
        ).toFixed(1),
      },
    ];

    // Prepare cost comparison data
    const costCategories = [
      {
        name: "Layout Labor",
        Traditional: traditionalLaborCost,
        SitePrint: siteprintLaborCost,
        Rental: siteprintLaborCost,
      },
      {
        name: "Equipment Cost",
        Traditional: 0,
        SitePrint:
          analysisOptions.ownershipModel !== "rental"
            ? siteprintInfo.initialInvestment / 3 // Annual amortized cost (3-year)
            : siteprintInfo.rentalCost * projectCount, // Annual rental cost
        Rental: (() => {
          // Calculate rental cost for comparison
          let rentalDailyCost = 0;
          if (siteprintInfo.estimatedLayoutDays < 5) {
            rentalDailyCost = 400;
          } else if (siteprintInfo.estimatedLayoutDays > 15) {
            rentalDailyCost = 240;
          } else {
            rentalDailyCost = 320;
          }
          const rentalCostPerProject =
            rentalDailyCost * siteprintInfo.estimatedLayoutDays;
          return rentalCostPerProject * projectCount; // Annual rental cost
        })(),
      },
      {
        name: "Usage Costs",
        Traditional: 0,
        SitePrint: actualUsageCost,
        Rental: actualUsageCost,
      },
      {
        name: "Rework Costs",
        Traditional: traditionalReworkCost,
        SitePrint: siteprintReworkCost,
        Rental: siteprintReworkCost,
      },
    ];

    // Only add Free Printing row if it has value and:
    // - not in company analysis, OR
    // - in company analysis but uncapped usage cost > 12000
    if (
      freePrinting > 0 &&
      (analysisOptions.analysisType !== "company" || uncappedUsageCost > 12000)
    ) {
      // Find the index of Usage Costs row
      const usageIndex = costCategories.findIndex(
        (item) => item.name === "Usage Costs"
      );

      // Insert after Usage Costs
      if (usageIndex !== -1) {
        costCategories.splice(usageIndex + 1, 0, {
          name: "Free Printing Value",
          Traditional: 0,
          SitePrint: freePrinting,
          Rental: freePrinting,
        });
      }
    }

    // Add the per project total row
    costCategories.push({
      name:
        analysisOptions.analysisType === "company"
          ? "Total Annual Costs"
          : "Total Costs",
      Traditional: traditionalLaborCost + traditionalReworkCost,
      SitePrint:
        siteprintLaborCost +
        (analysisOptions.ownershipModel !== "rental"
          ? siteprintInfo.initialInvestment / 3
          : siteprintInfo.rentalCost * projectCount) +
        actualUsageCost +
        siteprintReworkCost,
      Rental:
        siteprintLaborCost +
        siteprintInfo.rentalCost * projectCount +
        actualUsageCost +
        siteprintReworkCost,
    });

    // Display first 24 periods only
    const displayData =
      analysisOptions.analysisType === "project"
        ? projectData.slice(0, 24)
        : monthlyData.slice(0, 24);

    setRoiData({
      combinedData: displayData,
      comparisonData: comparisonData,
      costComparisonData: costCategories,
      traditionalLaborCost,
      siteprintLaborCost,
      productivityIncrease,
      roi,
      breakeven,
      fiveYearROI,
      timeSavings: traditionalHours - siteprintHours,
      traditionalReworkCost,
      siteprintReworkCost,
      reworkSavings,
      reworkPercentage: traditionalInfo.reworkPercentage,
      traditionalLayoutDays,
      siteprintLayoutDays,
      traditionalManHours,
      siteprintManHours,
      traditionalUnitCost,
      siteprintUnitCost,
      uncappedUsageCost,
      freePrinting,
      showRental:
        analysisOptions.ownershipModel !== "rental" &&
        siteprintLaborCost +
          siteprintInfo.initialInvestment / 3 +
          siteprintInfo.usageCost >
          traditionalLaborCost,
      rentalTotalCost,
      analysisType: analysisOptions.analysisType,
    });
  };

  // Calculate detailed benefit analysis
  const calculateBenefitAnalysis = () => {
    // Calculate base values
    const projectCount =
      analysisOptions.analysisType === "project"
        ? 1
        : traditionalInfo.projectCount;
    const traditionalLaborCost = roiData.traditionalLaborCost;
    const siteprintLaborCost = roiData.siteprintLaborCost;

    // Calculate rework savings - Directly use traditional rework cost from ROI data
    const reworkSavings =
      roiData.traditionalReworkCost * (benefitData.selectedReduction / 100);

    // Calculate improved communication value
    // Estimate: 2 RFIs avoided per project at $2,000 each
    const communicationSavings = 2 * 2000 * projectCount;

    // Calculate schedule reduction value
    // Estimate: 5% of project value saved through faster completion
    const projectValue = traditionalLaborCost * 5; // Estimate total project value as 5x labor
    const scheduleSavings = projectValue * 0.05;

    // Calculate health & safety benefits
    // Estimate: $500 per project in reduced injury risk and improved satisfaction
    const safetySavings = 500 * projectCount;

    // Calculate competitive advantage value
    // Estimate: 1% of annual project value in additional projects won
    const competitiveValue =
      analysisOptions.analysisType === "company" ? projectValue * 0.01 : 0;

    setBenefitData((prev) => ({
      ...prev,
      reworkSavings,
      communicationSavings,
      scheduleSavings,
      safetySavings,
      competitiveValue,
    }));
  };

  // Format number with US commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  // Format number with 2 decimal places and commas
  const formatNumberWithDecimals = (value) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate total additional benefits value (from checked benefits)
  const calculateTotalAdditionalBenefits = () => {
    let total = 0;

    if (benefitData.enabledBenefits.rework) {
      total += benefitData.reworkSavings;
    }

    if (benefitData.enabledBenefits.communication) {
      total += benefitData.communicationSavings;
    }

    if (benefitData.enabledBenefits.schedule) {
      total += benefitData.scheduleSavings;
    }

    if (benefitData.enabledBenefits.safety) {
      total += benefitData.safetySavings;
    }

    if (benefitData.enabledBenefits.competitive) {
      total += benefitData.competitiveValue;
    }

    return total;
  };

  // Validate customer info (all fields required except phone)
  const validateCustomerInfo = () => {
    return (
      customerInfo.companyName.trim() !== "" &&
      customerInfo.contactName.trim() !== "" &&
      customerInfo.zipCode.trim() !== "" &&
      customerInfo.email.trim() !== ""
    );
  };

  // Customer Info Slide
  const renderCustomerInfoSlide = () => (
    <div className="p-6 bg-blue-50 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Customer Information
      </h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="companyName"
            value={customerInfo.companyName}
            onChange={handleCustomerInfoChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="contactName"
            value={customerInfo.contactName}
            onChange={handleCustomerInfoChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zip Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="zipCode"
            value={customerInfo.zipCode}
            onChange={handleCustomerInfoChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={customerInfo.email}
            onChange={handleCustomerInfoChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={customerInfo.phone}
            onChange={handleCustomerInfoChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        <span className="text-red-500">*</span> Required fields
      </p>
    </div>
  );

  // Analysis Options & Input Slide
  const renderInfoSlide = () => (
    <div className="p-6 bg-blue-50 rounded-lg shadow-lg mx-auto max-w-4xl">
      <div className="mb-6 bg-white p-4 rounded-lg">
        <h3 className="text-xl font-bold mb-4 text-center">Analysis Options</h3>
        <div className="grid grid-cols-2 gap-6">
          {/* Analysis Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Analysis Type
            </label>
            <select
              name="analysisType"
              value={analysisOptions.analysisType}
              onChange={handleOptionChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="project">Single Project ROI</option>
              <option value="company">Company-wide ROI</option>
            </select>
          </div>

          {/* Layout Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Layout Type
            </label>
            <select
              name="layoutType"
              value={analysisOptions.layoutType}
              onChange={handleOptionChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="line">Line Layout</option>
              <option value="point">Point Layout</option>
            </select>
          </div>

          {/* Measurement Unit (only shown for Line Layout) */}
          {analysisOptions.layoutType === "line" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Measurement Unit
              </label>
              <select
                name="measurementUnit"
                value={analysisOptions.measurementUnit}
                onChange={handleOptionChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="squareFeet">Square Feet</option>
                <option value="linealFeet">Lineal Feet</option>
              </select>
            </div>
          )}

          {/* Project Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {analysisOptions.layoutType === "line"
                ? analysisOptions.measurementUnit === "squareFeet"
                  ? "Square Feet"
                  : "Lineal Feet"
                : "Points"}{" "}
              Per Project
            </label>
            <input
              type="number"
              name="projectSize"
              value={traditionalInfo.projectSize}
              onChange={handleTraditionalInfoChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="0"
            />
          </div>

          {/* Projects per Year (only shown for company-wide analysis) */}
          {analysisOptions.analysisType === "company" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projects per Year
              </label>
              <input
                type="number"
                name="projectCount"
                value={traditionalInfo.projectCount}
                onChange={handleTraditionalInfoChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="1"
                step="1"
              />
            </div>
          )}

          {/* Ownership Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ownership Model
            </label>
            <select
              name="ownershipModel"
              value={analysisOptions.ownershipModel}
              onChange={handleOptionChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="fullKit">Full HP SitePrint Kit</option>
              <option value="printerOnly">HP SitePrint Only</option>
              <option value="rental">HP Rental</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-xl font-bold mb-4 text-center">
          Traditional Method
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Workers
            </label>
            <input
              type="number"
              name="workerCount"
              value={traditionalInfo.workerCount}
              onChange={handleTraditionalInfoChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate ($)
            </label>
            <input
              type="number"
              name="hourlyRate"
              value={traditionalInfo.hourlyRate}
              onChange={handleTraditionalInfoChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Productivity Rate (
              {analysisOptions.layoutType === "line"
                ? analysisOptions.measurementUnit === "squareFeet"
                  ? "sq ft/hour"
                  : "linear ft/hour"
                : "points/hour"}
              )
            </label>
            <input
              type="number"
              name="productivity"
              value={traditionalInfo.productivity}
              onChange={handleTraditionalInfoChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typical Rework Percentage (%)
            </label>
            <input
              type="number"
              name="reworkPercentage"
              value={traditionalInfo.reworkPercentage}
              onChange={handleTraditionalInfoChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="0"
              max="100"
              step="1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ROI Dashboard Slide
  const renderROIDashboardSlide = () => (
    <div className="p-6 bg-blue-50 rounded-lg shadow-lg mx-auto max-w-4xl">
      <h2 className="text-2xl font-bold mb-6 text-center">
        HP SitePrint ROI Dashboard
      </h2>

      {/* Productivity Rate Icons - CONSISTENT STYLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-white rounded-lg">
        {/* Productivity */}
        <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg">
          <Clock size={32} className="text-blue-500 mb-2" />
          <h3 className="text-md font-semibold text-center mb-1">
            {analysisOptions.layoutType === "line"
              ? analysisOptions.measurementUnit === "squareFeet"
                ? "Square Feet/Hour"
                : "Lineal Feet/Hour"
              : "Points/Hour"}
          </h3>
          <p className="text-lg font-bold text-green-600">
            {siteprintInfo.productivity}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(
              siteprintInfo.productivity / traditionalInfo.productivity
            )}
            x faster than traditional
          </p>
        </div>

        {/* Workers */}
        <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg">
          <Users size={32} className="text-blue-500 mb-2" />
          <h3 className="text-md font-semibold text-center mb-1">Workers</h3>
          <p className="text-lg font-bold text-green-600">
            {siteprintInfo.workerCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(
              ((traditionalInfo.workerCount - siteprintInfo.workerCount) /
                traditionalInfo.workerCount) *
                100
            )}
            % fewer than traditional
          </p>
        </div>

        {/* Manhours Saved */}
        <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg">
          <Clock size={32} className="text-blue-500 mb-2" />
          <h3 className="text-md font-semibold text-center mb-1">
            Manhours Saved
          </h3>
          <p className="text-lg font-bold text-green-600">
            {(roiData.traditionalManHours - roiData.siteprintManHours).toFixed(
              1
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(
              ((roiData.traditionalManHours - roiData.siteprintManHours) /
                roiData.traditionalManHours) *
                100
            )}
            % reduction
          </p>
        </div>

        {/* Days Saved */}
        <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg">
          <Calendar size={32} className="text-blue-500 mb-2" />
          <h3 className="text-md font-semibold text-center mb-1">Days Saved</h3>
          <p className="text-lg font-bold text-green-600">
            {roiData.traditionalLayoutDays - roiData.siteprintLayoutDays}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(
              ((roiData.traditionalLayoutDays - roiData.siteprintLayoutDays) /
                roiData.traditionalLayoutDays) *
                100
            )}
            % reduction
          </p>
        </div>
      </div>

      {/* Cost Comparison Table */}
      <div className="bg-white p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Cost Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 border text-left">Cost Category</th>
                <th className="p-3 border text-center">Traditional Method</th>
                <th className="p-3 border text-center">
                  HP SitePrint{" "}
                  {analysisOptions.ownershipModel === "rental"
                    ? "(Rental)"
                    : "(Purchase)"}
                </th>
                {roiData.showRental && (
                  <th className="p-3 border text-center">
                    HP SitePrint (Rental)
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {roiData.costComparisonData &&
                roiData.costComparisonData.map((row, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="p-3 border font-medium">{row.name}</td>
                    <td className="p-3 border text-center">
                      {formatCurrency(row.Traditional)}
                    </td>
                    <td className="p-3 border text-center">
                      {row.name === "Free Printing Value" &&
                      row.SitePrint > 0 ? (
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(row.SitePrint)}
                        </span>
                      ) : row.name === "Equipment Cost" &&
                        analysisOptions.ownershipModel !== "rental" ? (
                        <div>
                          {formatCurrency(row.SitePrint)}
                          <div className="text-xs text-gray-500">
                            (3-year annualized)
                          </div>
                        </div>
                      ) : (
                        formatCurrency(row.SitePrint)
                      )}
                    </td>
                    {roiData.showRental && (
                      <td className="p-3 border text-center">
                        {row.name === "Free Printing Value" &&
                        row.Rental > 0 ? (
                          <span className="text-green-600 font-semibold">
                            {formatCurrency(row.Rental)}
                          </span>
                        ) : (
                          formatCurrency(row.Rental)
                        )}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {roiData.freePrinting > 0 && (
          <p className="text-sm text-green-600 mt-2 italic">
            * Free Printing represents the value of printing that exceeds the
            monthly cap but is included at no additional cost.
          </p>
        )}

        {roiData.showRental && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <Calculator size={18} className="text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Tip:</strong> Based on your project parameters, the
                  rental option may be more cost-effective than purchasing. With
                  rental, you avoid the large upfront investment while still
                  benefiting from the productivity gains.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layout Comparison Table */}
      <div className="bg-white p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">
          Layout Performance Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 border text-left">Metric</th>
                <th className="p-3 border text-left">Traditional Method</th>
                <th className="p-3 border text-left">HP SitePrint</th>
                <th className="p-3 border text-left">Improvement</th>
              </tr>
            </thead>
            <tbody>
              {roiData.comparisonData &&
                roiData.comparisonData.map((row, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="p-3 border font-medium">{row.name}</td>
                    <td className="p-3 border">
                      {row.name.includes("Cost per") ||
                      row.name.includes("Hours") ||
                      parseFloat(row.Traditional) % 1 !== 0
                        ? formatNumberWithDecimals(row.Traditional)
                        : formatNumber(row.Traditional)}
                    </td>
                    <td className="p-3 border">
                      {row.name.includes("Cost per") ||
                      row.name.includes("Hours") ||
                      parseFloat(row.SitePrint) % 1 !== 0
                        ? formatNumberWithDecimals(row.SitePrint)
                        : formatNumber(row.SitePrint)}
                    </td>
                    <td className="p-3 border">
                      {parseFloat(row.improvement) >= 0 ? (
                        <span className="text-green-600 font-semibold">
                          {parseFloat(row.improvement).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">
                          {parseFloat(row.improvement).toFixed(2)}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakeven Point Graph - WITHOUT the explanation text area */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Breakeven Analysis</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={roiData.combinedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="Traditional"
                stroke="#3B82F6"
                name="Traditional Cost"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="SitePrint"
                stroke="#10B981"
                name="HP SitePrint Cost (with investment)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // Benefit Analysis Slide
  const renderBenefitAnalysisSlide = () => (
    <div className="p-6 bg-blue-50 rounded-lg shadow-lg mx-auto max-w-4xl">
      <h2 className="text-2xl font-bold mb-6 text-center">
        HP SitePrint Benefits Analysis
      </h2>

      {/* Rework Reduction Control */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">
          Rework Reduction Percentage
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">
              {benefitData.reductionRanges.min}%
            </span>
            <span className="text-sm font-medium text-blue-700">
              {benefitData.selectedReduction}%
            </span>
            <span className="text-sm font-medium text-gray-700">
              {benefitData.reductionRanges.max}%
            </span>
          </div>
          <input
            type="range"
            min={benefitData.reductionRanges.min}
            max={benefitData.reductionRanges.max}
            value={benefitData.selectedReduction}
            onChange={handleReductionChange}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-sm text-gray-600 mt-2">
            Based on industry data, HP SitePrint solutions can reduce rework by{" "}
            {benefitData.reductionRanges.min}% to{" "}
            {benefitData.reductionRanges.max}%. Adjust the slider to see
            different reduction scenarios.
          </p>
        </div>
      </div>

      {/* Benefits Summary */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Annual Rework Costs */}
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-md font-semibold mb-1">
            Annual Rework Costs (Traditional)
          </h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(roiData.traditionalReworkCost)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Based on {traditionalInfo.reworkPercentage}% rework for traditional
            methods
          </p>
        </div>

        {/* Rework Savings */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-md font-semibold mb-1">Rework Cost Savings</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(benefitData.reworkSavings)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {benefitData.selectedReduction}% reduction in rework costs
          </p>
        </div>

        {/* Communication Savings */}
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h3 className="text-md font-semibold mb-1">
            Communication & Collaboration Savings
          </h3>
          <p className="text-2xl font-bold text-indigo-600">
            {formatCurrency(benefitData.communicationSavings)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Reduced RFIs and improved stakeholder alignment
          </p>
        </div>

        {/* Schedule Savings */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-md font-semibold mb-1">
            Schedule Improvement Value
          </h3>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(benefitData.scheduleSavings)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Value of avoiding delays and penalties
          </p>
        </div>
      </div>

      {/* Benefits Analysis Detail */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">
          Benefits Analysis Breakdown
        </h3>

        <div className="space-y-4">
          {/* Removed the "Reduced Layout Expenses" section as requested */}

          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800 flex items-center">
                <CheckCircle size={18} className="text-blue-500 mr-2" />
                Improved Communication & Collaboration
              </h4>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableCommunication"
                  checked={benefitData.enabledBenefits.communication}
                  onChange={() => handleBenefitToggle("communication")}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="enableCommunication"
                  className="ml-2 text-sm text-gray-700"
                >
                  Include in ROI
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              HP SitePrint aligns stakeholders with a unified model, enhancing
              coordination and reducing miscommunication. Benefits include:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 mb-3">
              <li>Reduced information requests and clarifications</li>
              <li>Fewer coordination meetings needed</li>
              <li>More accurate execution of design intent</li>
              <li>Improved cross-trade coordination</li>
            </ul>
            <p className="text-sm text-gray-700">
              Average cost per RFI: $2,000. Estimated savings:{" "}
              {formatCurrency(benefitData.communicationSavings)}
            </p>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800 flex items-center">
                <CheckCircle size={18} className="text-purple-500 mr-2" />
                Reduced Rework Costs
              </h4>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableRework"
                  checked={benefitData.enabledBenefits.rework}
                  onChange={() => handleBenefitToggle("rework")}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="enableRework"
                  className="ml-2 text-sm text-gray-700"
                >
                  Include in ROI
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              Rework accounts for 5-12% of project costs, with 48% linked to
              miscommunication:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 mb-3">
              <li>
                More precise layout means fewer errors during construction
              </li>
              <li>Digital workflows reduce human error in translation</li>
              <li>Improved accuracy of measurements and positioning</li>
              <li>Faster detection and correction of issues</li>
            </ul>
            <p className="text-sm text-gray-700">
              With a {benefitData.selectedReduction}% reduction in rework,
              you'll save {formatCurrency(benefitData.reworkSavings)}
            </p>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800 flex items-center">
                <CheckCircle size={18} className="text-orange-500 mr-2" />
                Schedule Reduction
              </h4>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableSchedule"
                  checked={benefitData.enabledBenefits.schedule}
                  onChange={() => handleBenefitToggle("schedule")}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="enableSchedule"
                  className="ml-2 text-sm text-gray-700"
                >
                  Include in ROI
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              HP SitePrint helps avoid costly delays that can increase project
              costs by 20%-30%:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 mb-3">
              <li>
                Faster layout process accelerates overall construction schedule
              </li>
              <li>Reduced rework prevents schedule disruptions</li>
              <li>Avoids liquidated damages and penalties</li>
              <li>Reduces extended general conditions and labor costs</li>
              <li>
                Earlier occupancy and revenue generation for building owners
              </li>
            </ul>
            <p className="text-sm text-gray-700">
              Estimated schedule improvement value:{" "}
              {formatCurrency(benefitData.scheduleSavings)}
            </p>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800 flex items-center">
                <CheckCircle size={18} className="text-teal-500 mr-2" />
                Enhanced Health & Safety
              </h4>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableSafety"
                  checked={benefitData.enabledBenefits.safety}
                  onChange={() => handleBenefitToggle("safety")}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="enableSafety"
                  className="ml-2 text-sm text-gray-700"
                >
                  Include in ROI
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              HP SitePrint improves job site safety and worker well-being:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 mb-3">
              <li>
                Reduces physical strain from repetitive tasks like manual layout
              </li>
              <li>Lowers risk of musculoskeletal injuries</li>
              <li>Reduces time spent in potentially hazardous areas</li>
              <li>Improves employee satisfaction and retention</li>
              <li>Reduces workers' compensation claims and insurance costs</li>
            </ul>
            <p className="text-sm text-gray-700">
              Estimated health & safety benefit:{" "}
              {formatCurrency(benefitData.safetySavings)}
            </p>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800 flex items-center">
                <CheckCircle size={18} className="text-pink-500 mr-2" />
                Innovation, Leadership & Competitive Advantage
              </h4>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableCompetitive"
                  checked={benefitData.enabledBenefits.competitive}
                  onChange={() => handleBenefitToggle("competitive")}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="enableCompetitive"
                  className="ml-2 text-sm text-gray-700"
                >
                  Include in ROI
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              Position your company as a cutting-edge leader in construction
              technology:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 mb-3">
              <li>Differentiation in bidding processes</li>
              <li>
                Attraction of top talent interested in innovative companies
              </li>
              <li>Enhanced reputation for reliability and quality</li>
              <li>
                Ability to win more projects through demonstrated innovation
              </li>
              <li>Marketing advantage in promoting advanced capabilities</li>
            </ul>
            <p className="text-sm text-gray-700">
              Estimated competitive advantage value:{" "}
              {formatCurrency(benefitData.competitiveValue)}
            </p>
          </div>
        </div>
      </div>

      {/* ROI Impact Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-100">
        <h3 className="text-lg font-semibold mb-3">Impact on ROI</h3>
        <p className="text-sm text-gray-700 mb-4">
          When factoring in selected benefits, the return on your HP SitePrint
          investment becomes even more compelling:
        </p>

        <div className="grid grid-cols-2 gap-4">
          {analysisOptions.ownershipModel !== "rental" ? (
            <>
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-medium text-gray-800 mb-1">
                  Standard ROI (Labor Savings)
                </h4>
                <p className="text-xl font-bold text-blue-600">
                  {Math.round(roiData.roi)}%
                </p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-medium text-gray-800 mb-1">
                  Enhanced ROI (With Selected Benefits)
                </h4>
                <p className="text-xl font-bold text-green-600">
                  {Math.round(
                    ((roiData.traditionalLaborCost -
                      roiData.siteprintLaborCost +
                      calculateTotalAdditionalBenefits()) /
                      siteprintInfo.initialInvestment) *
                      100
                  )}
                  %
                </p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-medium text-gray-800 mb-1">
                  3-Year Cost Savings
                </h4>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(
                    (roiData.traditionalLaborCost +
                      roiData.traditionalReworkCost) *
                      3 -
                      ((roiData.siteprintLaborCost +
                        roiData.siteprintReworkCost) *
                        3 +
                        siteprintInfo.initialInvestment)
                  )}
                </p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-medium text-gray-800 mb-1">
                  3-Year Enhanced Savings
                </h4>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(
                    (roiData.traditionalLaborCost +
                      roiData.traditionalReworkCost) *
                      3 -
                      ((roiData.siteprintLaborCost +
                        roiData.siteprintReworkCost) *
                        3 +
                        siteprintInfo.initialInvestment) +
                      calculateTotalAdditionalBenefits() * 3
                  )}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-medium text-gray-800 mb-1">
                  3-Year Cost Difference
                </h4>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(
                    (roiData.traditionalLaborCost +
                      roiData.traditionalReworkCost) *
                      3 -
                      (roiData.siteprintLaborCost +
                        siteprintInfo.rentalCost *
                          traditionalInfo.projectCount +
                        roiData.siteprintReworkCost) *
                        3
                  )}
                </p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-medium text-gray-800 mb-1">
                  3-Year Enhanced Savings
                </h4>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(
                    (roiData.traditionalLaborCost +
                      roiData.traditionalReworkCost) *
                      3 -
                      (roiData.siteprintLaborCost +
                        siteprintInfo.rentalCost *
                          traditionalInfo.projectCount +
                        roiData.siteprintReworkCost) *
                        3 +
                      calculateTotalAdditionalBenefits() * 3
                  )}
                </p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-medium text-gray-800 mb-1">
                  Annual Labor Savings
                </h4>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(
                    roiData.traditionalLaborCost -
                      roiData.siteprintLaborCost -
                      siteprintInfo.rentalCost * traditionalInfo.projectCount
                  )}
                </p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-medium text-gray-800 mb-1">
                  Annual Total Savings (With Benefits)
                </h4>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(
                    roiData.traditionalLaborCost -
                      roiData.siteprintLaborCost -
                      siteprintInfo.rentalCost * traditionalInfo.projectCount +
                      calculateTotalAdditionalBenefits()
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-100 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-2">
          HP SitePrint ROI Calculator
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Calculate your return on investment with HP SitePrint for layout
          automation
        </p>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentSlide >= 1 ? "bg-blue-500 text-white" : "bg-gray-300"
              }`}
            >
              1
            </div>
            <div
              className={`w-16 h-1 ${
                currentSlide > 1 ? "bg-blue-500" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentSlide >= 2 ? "bg-blue-500 text-white" : "bg-gray-300"
              }`}
            >
              2
            </div>
            <div
              className={`w-16 h-1 ${
                currentSlide > 2 ? "bg-blue-500" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentSlide >= 3 ? "bg-blue-500 text-white" : "bg-gray-300"
              }`}
            >
              3
            </div>
            <div
              className={`w-16 h-1 ${
                currentSlide > 3 ? "bg-blue-500" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentSlide >= 4 ? "bg-blue-500 text-white" : "bg-gray-300"
              }`}
            >
              4
            </div>
          </div>
        </div>

        {/* Content slides */}
        <div className="mb-8">
          {currentSlide === 1 && renderCustomerInfoSlide()}
          {currentSlide === 2 && renderInfoSlide()}
          {currentSlide === 3 && renderROIDashboardSlide()}
          {currentSlide === 4 && renderBenefitAnalysisSlide()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-center space-x-4">
          {currentSlide > 1 && (
            <button
              onClick={prevSlide}
              className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md transition duration-200"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </button>
          )}

          {currentSlide === 1 && (
            <button
              onClick={nextSlide}
              disabled={!validateCustomerInfo()}
              className={`flex items-center ${
                validateCustomerInfo()
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-400 cursor-not-allowed"
              } text-white px-4 py-2 rounded-md transition duration-200`}
            >
              Next
              <ArrowRight size={16} className="ml-2" />
            </button>
          )}

          {currentSlide === 2 && (
            <button
              onClick={nextSlide}
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200"
            >
              Calculate ROI
              <ArrowRight size={16} className="ml-2" />
            </button>
          )}

          {currentSlide === 3 && (
            <button
              onClick={nextSlide}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition duration-200"
            >
              View Benefits Analysis
              <ArrowRight size={16} className="ml-2" />
            </button>
          )}

          {/* {currentSlide === 4 && (
            <button className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition duration-200">
              Generate Report
              <ArrowRight size={16} className="ml-2" />
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default HPSitePrintROICalculator;
