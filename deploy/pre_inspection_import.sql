-- pre_inspection bootstrap for digital_auto_pre_inspection_portal
-- Import into empty database: pre_inspection
-- phpMyAdmin: select DB pre_inspection -> Import -> choose this file
-- CLI: mysql -u root -p pre_inspection < deploy/pre_inspection_import.sql
--
-- Demo login after import: demo@demo.com / demo
-- For full production data, copy from digitalauto_db_digitalauto instead.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SESSION innodb_strict_mode = 0;
USE `pre_inspection`;


-- ===== CORE SCHEMA (from Prisma) =====
-- CreateTable
CREATE TABLE IF NOT EXISTS `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` TIMESTAMP(0) NULL,
    `password` VARCHAR(255) NOT NULL,
    `remember_token` VARCHAR(100) NULL,
    `city_id` INTEGER NULL,
    `bank_id` INTEGER NULL,
    `type` VARCHAR(50) NOT NULL DEFAULT '',
    `is_admin` TINYINT NOT NULL DEFAULT 0,
    `status` VARCHAR(50) NULL DEFAULT 'Active',
    `is_deleted` TINYINT NOT NULL DEFAULT 0,
    `verified_at` TIMESTAMP(0) NULL,
    `last_activity` TIMESTAMP(0) NULL,
    `is_online` TINYINT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `users_email_unique`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `menus` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(50) NULL,
    `short_code` VARCHAR(100) NULL,
    `module` VARCHAR(100) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `activity_log` (
    `id` BIGINT UNSIGNED NOT NULL,
    `log_name` VARCHAR(255) NULL,
    `description` TEXT NOT NULL,
    `subject_type` VARCHAR(255) NULL,
    `event` VARCHAR(255) NULL,
    `subject_id` BIGINT UNSIGNED NULL,
    `causer_type` VARCHAR(255) NULL,
    `causer_id` BIGINT UNSIGNED NULL,
    `properties` LONGTEXT NULL,
    `batch_uuid` CHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `password_resets` (
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `m_bank` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(250) NOT NULL,
    `contact_person` VARCHAR(250) NOT NULL,
    `phone` VARCHAR(250) NOT NULL,
    `emailid` VARCHAR(250) NOT NULL,
    `pincode` VARCHAR(250) NOT NULL,
    `ifsc` VARCHAR(250) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `m_broker` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `m_city` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(250) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `m_company` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `m_model` (
    `id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `name` VARCHAR(250) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `m_variant` (
    `id` INTEGER NOT NULL,
    `company_id` INTEGER NOT NULL,
    `model_id` INTEGER NOT NULL,
    `name` VARCHAR(250) NOT NULL,
    `vehicle_type` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `rc_details` (
    `id` INTEGER NOT NULL,
    `rc_blacklist_status` VARCHAR(255) NULL,
    `rc_body_type_desc` VARCHAR(255) NULL,
    `rc_chasi_no` VARCHAR(255) NULL,
    `rc_color` VARCHAR(255) NULL,
    `rc_cubic_cap` VARCHAR(255) NULL,
    `rc_eng_no` VARCHAR(255) NULL,
    `rc_f_name` VARCHAR(255) NULL,
    `rc_financer` VARCHAR(255) NULL,
    `rc_fit_upto` VARCHAR(255) NULL,
    `rc_fuel_desc` VARCHAR(255) NULL,
    `rc_gvw` VARCHAR(255) NULL,
    `rc_insurance_type` VARCHAR(50) NULL,
    `rc_insurance_comp` VARCHAR(255) NULL,
    `rc_insurance_policy_no` VARCHAR(255) NULL,
    `rc_insurance_from` VARCHAR(50) NULL,
    `rc_insurance_upto` VARCHAR(255) NULL,
    `rc_maker_desc` VARCHAR(255) NULL,
    `rc_maker_model` VARCHAR(255) NULL,
    `rc_manu_month_yr` VARCHAR(255) NULL,
    `rc_mobile_no` VARCHAR(255) NULL,
    `rc_no_cyl` VARCHAR(255) NULL,
    `rc_noc_date` VARCHAR(255) NULL,
    `rc_noc_details` VARCHAR(255) NULL,
    `rc_noc_to` VARCHAR(255) NULL,
    `rc_norms_desc` VARCHAR(255) NULL,
    `rc_owner_name` VARCHAR(255) NULL,
    `rc_owner_sr` VARCHAR(255) NULL,
    `rc_permanent_address` VARCHAR(255) NULL,
    `rc_permit_issue_dt` VARCHAR(255) NULL,
    `rc_permit_no` VARCHAR(255) NULL,
    `rc_permit_type` VARCHAR(255) NULL,
    `rc_permit_valid_from` VARCHAR(255) NULL,
    `rc_permit_valid_upto` VARCHAR(255) NULL,
    `rc_present_address` VARCHAR(255) NULL,
    `rc_pucc_no` VARCHAR(255) NULL,
    `rc_pucc_from` VARCHAR(50) NULL,
    `rc_pucc_upto` VARCHAR(255) NULL,
    `rc_registered_at` VARCHAR(255) NULL,
    `rc_regn_dt` VARCHAR(255) NULL,
    `rc_regn_no` VARCHAR(255) NULL,
    `rc_regn_valid_upto` VARCHAR(20) NULL,
    `rc_old_regn_no` VARCHAR(25) NULL,
    `rc_rto_code` VARCHAR(255) NULL,
    `rc_seat_cap` VARCHAR(255) NULL,
    `rc_sleeper_cap` VARCHAR(255) NULL,
    `rc_stand_cap` VARCHAR(255) NULL,
    `rc_status` VARCHAR(255) NULL,
    `rc_status_as_on` VARCHAR(255) NULL,
    `rc_tax_type` VARCHAR(50) NULL,
    `rc_tax_amount` VARCHAR(255) NULL,
    `rc_tax_paid_date` VARCHAR(255) NULL,
    `rc_tax_upto` VARCHAR(255) NULL,
    `rc_unld_wt` VARCHAR(255) NULL,
    `rc_vch_catg` VARCHAR(255) NULL,
    `rc_vh_class_desc` VARCHAR(255) NULL,
    `rc_wheelbase` VARCHAR(255) NULL,
    `state_cd` VARCHAR(255) NULL,
    `rc_purchase_dt` TEXT NULL,
    `rto_cd` TEXT NULL,
    `rc_ncrb_status` TEXT NULL,
    `rc_vh_type` TEXT NULL,
    `rc_vh_class` TEXT NULL,
    `rc_noc_dt` TEXT NULL,
    `rc_fuel_cd` TEXT NULL,
    `rc_maker_cd` TEXT NULL,
    `rc_model_cd` TEXT NULL,
    `rc_norms_cd` TEXT NULL,
    `rc_sale_amt` TEXT NULL,
    `rc_own_catg_desc` TEXT NULL,
    `rc_vch_catg_desc` TEXT NULL,
    `rc_owner_cd_desc` TEXT NULL,
    `rc_vehicle_surrendered_to_dealer` TEXT NULL,
    `rc_currentadd_districtcode` TEXT NULL,
    `rc_non_use` TEXT NULL,
    `rc_passenger_tax` TEXT NULL,
    `rc_goods_tax` TEXT NULL,
    `rc_no_of_axle` TEXT NULL,
    `rc_aitp_upto` TEXT NULL,
    `rc_aitp_no` TEXT NULL,
    `rc_qr_url` TEXT NULL,
    `rc_auth_name` TEXT NULL,
    `rc_auth_sign` TEXT NULL,
    `rc_approval_date` TEXT NULL,
    `rc_hp` TEXT NULL,
    `rc_mandal_desc` TEXT NULL,
    `rc_taluk_cd` TEXT NULL,
    `rc_tax_mode` TEXT NULL,
    `rc_width` TEXT NULL,
    `rc_fitness_result` TEXT NULL,
    `rc_aitp_pmt_upto` TEXT NULL,
    `rc_aitp_pmt_no` TEXT NULL,
    `rc_non_use_from` TEXT NULL,
    `rc_non_use_upto` TEXT NULL,
    `rc_hsrp_affixed` TEXT NULL,
    `rc_hsrp_no_front` TEXT NULL,
    `rc_hsrp_no_back` TEXT NULL,
    `rc_gcw` TEXT NULL,
    `rc_floor_area` TEXT NULL,
    `rc_length` TEXT NULL,
    `rc_height` TEXT NULL,
    `rc_permit_service_type` TEXT NULL,
    `rc_counter_sign_upto` TEXT NULL,
    `rc_fitness_rqrd_for` TEXT NULL,
    `rc_fit_valid_to` TEXT NULL,
    `crn` VARCHAR(255) NULL,
    `status` VARCHAR(255) NULL,
    `request_timestamp` VARCHAR(255) NULL,
    `response_timestamp` VARCHAR(255) NULL,
    `total_time` VARCHAR(255) NULL,
    `MESSAGE` VARCHAR(255) NULL,
    `ERROR` VARCHAR(255) NULL,
    `DigitalNo` VARCHAR(255) NULL,
    `rc_api_user_id` INTEGER NULL,
    `api_request_id` VARCHAR(100) NULL,
    `api_request_status` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_deleted` TINYINT NOT NULL DEFAULT 0,

    INDEX `idx_regn`(`rc_regn_no`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `rc_api_users` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(255) NULL,
    `company` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `mobile` VARCHAR(255) NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(255) NULL,
    `state` VARCHAR(255) NULL,
    `zip` VARCHAR(25) NULL,
    `uuid` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_deleted` TINYINT NOT NULL DEFAULT 0
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `rc_api_requests` (
    `id` BIGINT NOT NULL,
    `rc_api_user_id` INTEGER NULL,
    `rc_detail_id` INTEGER NULL,
    `rc_regn_no` VARCHAR(255) NULL,
    `status` VARCHAR(255) NULL,
    `message` VARCHAR(255) NULL,
    `access_token` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `fin_year` (
    `id` INTEGER NOT NULL,
    `fsession` VARCHAR(100) NOT NULL,
    `ffrom` DATE NOT NULL,
    `fto` DATE NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `confiscated_auction_details` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `failed_jobs` (
    `id` BIGINT UNSIGNED NOT NULL,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` TEXT NOT NULL,
    `queue` TEXT NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_38a` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_address_changes` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `Application_No` VARCHAR(100) NULL,
    `Address_From` TEXT NULL,
    `Address_To` TEXT NULL,
    `Office` VARCHAR(255) NULL,
    `Changed_On` VARCHAR(100) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_alterations` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `Application_No` VARCHAR(100) NULL,
    `Alteration_Type` VARCHAR(100) NULL,
    `Details` TEXT NULL,
    `Office` VARCHAR(255) NULL,
    `Operation_Date` VARCHAR(100) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_blacklists` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(191) NULL,
    `Complain_File_Number` VARCHAR(500) NULL,
    `Complain_Date` VARCHAR(191) NULL,
    `Complain_Entered_By` VARCHAR(191) NULL,
    `Action_Taken` VARCHAR(191) NULL,
    `Action_Entered_By` VARCHAR(191) NULL,
    `Action_Date` VARCHAR(191) NULL,
    `Office` VARCHAR(191) NULL,
    `Compounding_Amount` VARCHAR(191) NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_challans` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(255) NULL,
    `Serial_No` INTEGER NULL,
    `Challan_No` VARCHAR(255) NULL,
    `Offense_Details` TEXT NULL,
    `Challan_Place` VARCHAR(255) NULL,
    `Challan_Date_Time` VARCHAR(255) NULL,
    `State` VARCHAR(255) NULL,
    `RTO` VARCHAR(255) NULL,
    `Accused_Name` VARCHAR(255) NULL,
    `Amount` VARCHAR(255) NULL,
    `Challan_Status` VARCHAR(255) NULL,
    `Payment_Source` VARCHAR(255) NULL,
    `Payment_Date` VARCHAR(255) NULL,
    `Receipt_Number` VARCHAR(255) NULL,
    `sent_to_reg_court` VARCHAR(255) NULL,
    `remark` TEXT NULL,
    `dl_no` VARCHAR(255) NULL,
    `driver_name` VARCHAR(255) NULL,
    `owner_name` VARCHAR(255) NULL,
    `department` VARCHAR(255) NULL,
    `document_impounded` VARCHAR(255) NULL,
    `amount_of_fine_imposed` VARCHAR(255) NULL,
    `court_address` VARCHAR(255) NULL,
    `court_name` VARCHAR(255) NULL,
    `date_of_proceeding` VARCHAR(255) NULL,
    `sent_to_court_on` VARCHAR(255) NULL,
    `sent_to_virtual_court` VARCHAR(255) NULL,
    `rto_distric_name` VARCHAR(255) NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_changed_vehicle_record_by_admins` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(191) NULL,
    `Sr_No` VARCHAR(191) NULL,
    `Changed_By` VARCHAR(191) NULL,
    `Changed_Data` TEXT NULL,
    `Changed_On` VARCHAR(191) NULL,
    `Office` VARCHAR(191) NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_changed_vehicle_records` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(50) NULL,
    `Sr_No` VARCHAR(50) NULL,
    `Changed_By` VARCHAR(255) NULL,
    `Changed_Data` TEXT NULL,
    `Changed_On` VARCHAR(255) NULL,
    `Office` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_cods` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `COD_No` VARCHAR(100) NULL,
    `Deposit_Date` VARCHAR(100) NULL,
    `Reason` TEXT NULL,
    `Office` VARCHAR(255) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_conversions` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `Application_No` VARCHAR(100) NULL,
    `From_Class` VARCHAR(100) NULL,
    `To_Class` VARCHAR(100) NULL,
    `Office` VARCHAR(255) NULL,
    `Operation_Date` VARCHAR(100) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_dispatch_rc` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_duplicate_rcs` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `Application_No` VARCHAR(100) NULL,
    `Reason` TEXT NULL,
    `Printed_On` VARCHAR(100) NULL,
    `Office` VARCHAR(255) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_fancy_fees` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_fitness` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(50) NULL,
    `Appl_No` VARCHAR(100) NULL,
    `Fitness_Check_Date` VARCHAR(255) NULL,
    `Result` VARCHAR(50) NULL,
    `Fitness_UPTO` VARCHAR(255) NULL,
    `NID` VARCHAR(100) NULL,
    `Operation_Date` VARCHAR(255) NULL,
    `Fitness_Officer_Name1` VARCHAR(255) NULL,
    `Fitness_Officer_Name2` VARCHAR(255) NULL,
    `Office` VARCHAR(255) NULL,
    `Remark` TEXT NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_fitnesses` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(191) NULL,
    `Application_No` VARCHAR(191) NULL,
    `Fitness_Check_Date` VARCHAR(191) NULL,
    `Result` VARCHAR(191) NULL,
    `Fitness_Upto` VARCHAR(191) NULL,
    `NID` VARCHAR(191) NULL,
    `Operation_Date` VARCHAR(191) NULL,
    `Fitness_Officer_Name1` VARCHAR(191) NULL,
    `Fitness_Officer_Name2` VARCHAR(191) NULL,
    `Office` VARCHAR(191) NULL,
    `Remark` VARCHAR(191) NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_hsrps` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `Application_No` VARCHAR(100) NULL,
    `HSRP_Number` VARCHAR(100) NULL,
    `Fixing_Date` VARCHAR(100) NULL,
    `Office` VARCHAR(255) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_hypothecation_terminations` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_hypothecations` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(255) NULL,
    `Application_No` VARCHAR(255) NULL,
    `Hypothecation_Type` VARCHAR(255) NULL,
    `Financer_Name` VARCHAR(255) NULL,
    `Financer_Address` VARCHAR(255) NULL,
    `From_Date` VARCHAR(255) NULL,
    `To_Date` VARCHAR(255) NULL,
    `Termination_Date` VARCHAR(255) NULL,
    `Office` VARCHAR(255) NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_insurances` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(255) NULL,
    `Sr_No` INTEGER NULL,
    `Insurance_Company` VARCHAR(255) NULL,
    `Insurance_Type` VARCHAR(255) NULL,
    `Insurance_From` VARCHAR(255) NULL,
    `Insurance_Upto` VARCHAR(255) NULL,
    `Cover_Note_No` VARCHAR(255) NULL,
    `Office` VARCHAR(255) NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_mobile_number_updations` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_noc` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(255) NULL,
    `Application_No` VARCHAR(255) NULL,
    `NOC_No` VARCHAR(255) NULL,
    `NOC_Date` VARCHAR(255) NULL,
    `State_To` VARCHAR(255) NULL,
    `Office_To` VARCHAR(255) NULL,
    `Dispatch_No` VARCHAR(255) NULL,
    `New_Owner` VARCHAR(255) NULL,
    `Office` VARCHAR(255) NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_noc_cancelled` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_np_authorisations` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `Authorisation_No` VARCHAR(100) NULL,
    `Valid_From` VARCHAR(100) NULL,
    `Valid_Upto` VARCHAR(100) NULL,
    `Office` VARCHAR(255) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_paid_fees` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(255) NULL,
    `Receipt_No` VARCHAR(255) NULL,
    `Receipt_Date` VARCHAR(255) NULL,
    `Fee_Amount` VARCHAR(255) NULL,
    `Fine` VARCHAR(255) NULL,
    `Fee_Particular` VARCHAR(255) NULL,
    `Office` VARCHAR(255) NULL,
    `GRN_No` VARCHAR(255) NULL,
    `Fee_Collected_As` VARCHAR(255) NULL,
    `collection_mode` VARCHAR(255) NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `Sr_No` TEXT NULL,
    `Application_No` TEXT NULL,

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_permit_transactions` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_permits` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(191) NULL,
    `Application_No` VARCHAR(191) NULL,
    `Permit_No` VARCHAR(191) NULL,
    `Issue_Date` VARCHAR(191) NULL,
    `Valid_From` VARCHAR(191) NULL,
    `Valid_Upto` VARCHAR(191) NULL,
    `Permit_Type` VARCHAR(191) NULL,
    `Permit_Category` VARCHAR(191) NULL,
    `Office` VARCHAR(191) NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_puccs` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `PUCC_No` VARCHAR(100) NULL,
    `PUCC_Upto` VARCHAR(100) NULL,
    `Result` VARCHAR(50) NULL,
    `Office` VARCHAR(255) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_rc_cancel` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_rc_print_details` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(191) NULL,
    `Application_No` VARCHAR(191) NULL,
    `Purpose` VARCHAR(191) NULL,
    `Printed_On` VARCHAR(191) NULL,
    `Printed_By` VARCHAR(191) NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_rc_surrender` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_rc_suspend` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_reassignments` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `Application_No` VARCHAR(100) NULL,
    `Old_Registration_No` VARCHAR(50) NULL,
    `New_Registration_No` VARCHAR(50) NULL,
    `Office` VARCHAR(255) NULL,
    `Operation_Date` VARCHAR(100) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_renewals` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `Application_No` VARCHAR(100) NULL,
    `Renewed_Upto` VARCHAR(100) NULL,
    `Office` VARCHAR(255) NULL,
    `Operation_Date` VARCHAR(100) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_road_taxes` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(255) NULL,
    `Receipt_No` VARCHAR(255) NULL,
    `Tax_From` VARCHAR(255) NULL,
    `Tax_Upto` VARCHAR(255) NULL,
    `Tax_Type` VARCHAR(255) NULL,
    `Challan_Date` VARCHAR(255) NULL,
    `Total_Amount` VARCHAR(255) NULL,
    `Office` VARCHAR(255) NULL,
    `Tax` VARCHAR(255) NULL,
    `Penalty` VARCHAR(255) NULL,
    `GRN_No` VARCHAR(255) NULL,
    `Breakup` VARCHAR(255) NULL,
    `Tax_Mode` VARCHAR(255) NULL,
    `collection_mode` VARCHAR(255) NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `Sr_No` TEXT NULL,
    `Application_No` TEXT NULL,

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_slds` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `Application_No` VARCHAR(100) NULL,
    `SLD_Number` VARCHAR(100) NULL,
    `Fitment_Date` VARCHAR(100) NULL,
    `Office` VARCHAR(255) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_swapping_retentions` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_tax_clears` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(191) NULL,
    `Sr_No` VARCHAR(191) NULL,
    `Tax_Description` VARCHAR(191) NULL,
    `Tax_Clear_To` VARCHAR(191) NULL,
    `TCR_No` VARCHAR(191) NULL,
    `Operation_Date` VARCHAR(191) NULL,
    `Remarks` VARCHAR(191) NULL,
    `Office` VARCHAR(191) NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_tax_exemptions` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_tax_installments` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_tax_refunds` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_temporary_permits` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_transfer_ownerships` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(255) NULL,
    `Application_No` VARCHAR(255) NULL,
    `Ownership_Serial` INTEGER NULL,
    `Owner_From` VARCHAR(255) NULL,
    `Owner_Upto` VARCHAR(255) NULL,
    `Owner_Name` VARCHAR(255) NULL,
    `Father_Husband_Name` VARCHAR(255) NULL,
    `Present_Address` VARCHAR(255) NULL,
    `Permanent_Address` VARCHAR(255) NULL,
    `Owner_Type` VARCHAR(255) NULL,
    `Sale_Auction_Date` VARCHAR(255) NULL,
    `Sale_Amount` VARCHAR(255) NULL,
    `Reason` VARCHAR(255) NULL,
    `Office` VARCHAR(255) NULL,
    `Deemed_Transfer_Time_Days` INTEGER NULL,
    `pulled_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_reg`(`Registration_No`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_of_vehicle_nonuse` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_pre_inspection_modules` (
    `id` INTEGER NOT NULL,
    `user_id` INTEGER NULL,
    `job_id` INTEGER NULL,
    `event` VARCHAR(191) NULL,
    `remark` TEXT NULL,
    `created_at` DATETIME(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `history_valuation_modules` (
    `id` INTEGER NOT NULL,
    `user_id` INTEGER NULL,
    `job_id` INTEGER NULL,
    `event` VARCHAR(191) NULL,
    `remark` TEXT NULL,
    `created_at` DATETIME(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `migrations` (
    `id` INTEGER UNSIGNED NOT NULL,
    `migration` VARCHAR(255) NOT NULL,
    `batch` INTEGER NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `model_has_permissions` (
    `permission_id` BIGINT UNSIGNED NOT NULL,
    `model_type` VARCHAR(255) NOT NULL,
    `model_id` BIGINT UNSIGNED NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `model_has_roles` (
    `role_id` BIGINT UNSIGNED NOT NULL,
    `model_type` VARCHAR(255) NOT NULL,
    `model_id` BIGINT UNSIGNED NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `oauth_access_tokens` (
    `id` CHAR(80) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `client_id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NULL,
    `scopes` TEXT NULL,
    `revoked` BOOLEAN NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `expires_at` DATETIME(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `oauth_auth_codes` (
    `id` CHAR(80) NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `client_id` CHAR(36) NOT NULL,
    `scopes` TEXT NULL,
    `revoked` BOOLEAN NOT NULL,
    `expires_at` DATETIME(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `oauth_clients` (
    `id` CHAR(36) NOT NULL,
    `owner_type` VARCHAR(255) NULL,
    `owner_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `secret` VARCHAR(255) NULL,
    `provider` VARCHAR(255) NULL,
    `redirect_uris` TEXT NOT NULL,
    `grant_types` TEXT NOT NULL,
    `revoked` BOOLEAN NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `oauth_device_codes` (
    `id` CHAR(80) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `client_id` CHAR(36) NOT NULL,
    `user_code` CHAR(8) NOT NULL,
    `scopes` TEXT NOT NULL,
    `revoked` BOOLEAN NOT NULL,
    `user_approved_at` DATETIME(0) NULL,
    `last_polled_at` DATETIME(0) NULL,
    `expires_at` DATETIME(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `oauth_refresh_tokens` (
    `id` CHAR(80) NOT NULL,
    `access_token_id` CHAR(80) NOT NULL,
    `revoked` BOOLEAN NOT NULL,
    `expires_at` DATETIME(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `old_registration_numbers` (
    `id` INTEGER NOT NULL,
    `vehicle_id` INTEGER NULL,
    `vehicle_no` VARCHAR(20) NOT NULL,
    `old_registration_no` VARCHAR(50) NOT NULL,
    `captured_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `old_rto_code` VARCHAR(20) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `permissions` (
    `id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `guard_name` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `remote_activity_logs` (
    `id` BIGINT NOT NULL,
    `machine_label` VARCHAR(100) NOT NULL,
    `worker_id` VARCHAR(50) NOT NULL,
    `source` VARCHAR(20) NOT NULL DEFAULT 'automation',
    `message` TEXT NOT NULL,
    `logged_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `role_has_permissions` (
    `permission_id` BIGINT UNSIGNED NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `roles` (
    `id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `guard_name` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `search_vrn_to_mobile_numbers` (
    `id` INTEGER NOT NULL,
    `vehicle_registration_number` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INTEGER NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `settings` (
    `id` INTEGER UNSIGNED NOT NULL,
    `key` VARCHAR(255) NOT NULL,
    `value` TEXT NOT NULL,
    `user_id` BIGINT UNSIGNED NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `sms_history_details` (
    `id` INTEGER NOT NULL,
    `Registration_No` VARCHAR(20) NULL,
    `full_row_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- CreateTable
CREATE TABLE IF NOT EXISTS `vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_no` VARCHAR(20) NOT NULL,
    `queue_order` INTEGER NULL,
    `owner_name` VARCHAR(255) NULL,
    `registration_date` VARCHAR(50) NULL,
    `chassis_no` VARCHAR(100) NULL,
    `engine_no` VARCHAR(100) NULL,
    `vehicle_class` VARCHAR(100) NULL,
    `fuel_type` VARCHAR(50) NULL,
    `fitness_upto` VARCHAR(50) NULL,
    `insurance_upto` VARCHAR(50) NULL,
    `pucc_upto` VARCHAR(50) NULL,
    `mv_tax_upto` VARCHAR(50) NULL,
    `maker_model` VARCHAR(255) NULL,
    `full_data` LONGTEXT NULL,
    `status` ENUM('Pending', 'Processing', 'Completed', 'Error', 'No Data') NULL DEFAULT 'Pending',
    `last_updated` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `mobile_no` TEXT NULL,
    `queue_hidden` BOOLEAN NOT NULL DEFAULT false,
    `processing_instance` TEXT NULL,
    `father_name` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_vehicle_no`(`vehicle_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ===== PI JOB / WHEELER TABLES =====
CREATE TABLE IF NOT EXISTS `tbl_2wheeler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_id` int(11) DEFAULT NULL,
  `proposer` TEXT DEFAULT NULL,
  `insurer_broker` TEXT DEFAULT NULL,
  `inspection_place` TEXT DEFAULT NULL,
  `insurer_ref_no` TEXT DEFAULT NULL,
  `ins_broker_name` TEXT DEFAULT NULL,
  `ins_broker_mobileno` TEXT DEFAULT NULL,
  `ins_broker_mailid` TEXT DEFAULT NULL,
  `ins_broker_agentcode` TEXT DEFAULT NULL,
  `inspection_case` TEXT DEFAULT NULL,
  `inspection_type` TEXT DEFAULT NULL,
  `vehicleno` TEXT DEFAULT NULL,
  `chassisno` TEXT DEFAULT NULL,
  `engineno` TEXT DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `model_id` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `year_of_manufacture` TEXT DEFAULT NULL,
  `odometer_reading` TEXT DEFAULT NULL,
  `rc_verified` TEXT DEFAULT NULL,
  `helmetbox` TEXT DEFAULT NULL,
  `laggage_carrier` TEXT DEFAULT NULL,
  `stepney` TEXT DEFAULT NULL,
  `leggaurd` TEXT DEFAULT NULL,
  `saree_gaurd` TEXT DEFAULT NULL,
  `fron_left_ind_light` TEXT DEFAULT NULL,
  `fron_right_ind_light` TEXT DEFAULT NULL,
  `front_mudgaurd` TEXT DEFAULT NULL,
  `front_hub_disc_drum` TEXT DEFAULT NULL,
  `front_wheel_rim` TEXT DEFAULT NULL,
  `from_shock_absorber` TEXT DEFAULT NULL,
  `speedometer_tachometer` TEXT DEFAULT NULL,
  `lever_clutch_hand_break` TEXT DEFAULT NULL,
  `chassis_frame` TEXT DEFAULT NULL,
  `crankCase_cylinder` TEXT DEFAULT NULL,
  `head_lamp_rim` TEXT DEFAULT NULL,
  `silencer` TEXT DEFAULT NULL,
  `chain_cover` TEXT DEFAULT NULL,
  `fork` TEXT DEFAULT NULL,
  `fairing` TEXT DEFAULT NULL,
  `fuel_tank` TEXT DEFAULT NULL,
  `kick_padal` TEXT DEFAULT NULL,
  `handel_bar` TEXT DEFAULT NULL,
  `rear_wheel_rim` TEXT DEFAULT NULL,
  `rear_shock_absorber` TEXT DEFAULT NULL,
  `rear_drum_disc` TEXT DEFAULT NULL,
  `rear_left_indicator_light` TEXT DEFAULT NULL,
  `rear_right_indicator_light` TEXT DEFAULT NULL,
  `rear_view_mirror_lt` TEXT DEFAULT NULL,
  `rear_view_mirror_rt` TEXT DEFAULT NULL,
  `rear_foot_rest` TEXT DEFAULT NULL,
  `rear_mudguard` TEXT DEFAULT NULL,
  `left_cover_shield` TEXT DEFAULT NULL,
  `right_cover_shield` TEXT DEFAULT NULL,
  `wisor` TEXT DEFAULT NULL,
  `tail_lamp` TEXT DEFAULT NULL,
  `tyres_front` TEXT DEFAULT NULL,
  `leg_side_right` TEXT DEFAULT NULL,
  `leg_shield_left` TEXT DEFAULT NULL,
  `inspection_status` TEXT DEFAULT NULL,
  `rear_cowl_left_centre_right` TEXT DEFAULT NULL,
  `stepney_bracket` TEXT DEFAULT NULL,
  `remarks` mediumtext DEFAULT NULL,
  `valuation_price` float DEFAULT NULL,
  `ownership_name` TEXT DEFAULT NULL,
  `video` mediumtext DEFAULT NULL,
  `s3video_url` TEXT DEFAULT NULL,
  `chassisphoto` mediumtext DEFAULT NULL,
  `QC` int(11) NOT NULL DEFAULT 0 COMMENT '0- quanlity check pending,1- Quality check don',
  `qc_checked_by` TEXT DEFAULT NULL,
  `qc_datetime` datetime DEFAULT NULL,
  `inspect_by` int(11) NOT NULL,
  `ctime` TEXT NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;


CREATE TABLE IF NOT EXISTS `tbl_3wheeler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_id` int(11) DEFAULT NULL,
  `proposer` TEXT DEFAULT NULL,
  `insurer_broker` TEXT DEFAULT NULL,
  `insurer_ref_no` TEXT DEFAULT NULL,
  `ins_broker_name` TEXT DEFAULT NULL,
  `ins_broker_mobileno` TEXT DEFAULT NULL,
  `ins_broker_mailid` TEXT DEFAULT NULL,
  `ins_broker_agentcode` TEXT DEFAULT NULL,
  `inspection_case` TEXT DEFAULT NULL,
  `inspection_type` TEXT DEFAULT NULL,
  `inspection_place` mediumtext DEFAULT NULL,
  `vehicleno` TEXT DEFAULT NULL,
  `chassisno` TEXT DEFAULT NULL,
  `engineno` TEXT DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `model_id` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `year_of_manufacture` TEXT DEFAULT NULL,
  `odometer_reading` TEXT DEFAULT NULL,
  `rc_verified` TEXT DEFAULT NULL,
  `colour` TEXT DEFAULT NULL,
  `fuel_used` TEXT DEFAULT NULL,
  `tyre_of_body` TEXT DEFAULT NULL,
  `chassis_production_no` TEXT DEFAULT NULL,
  `stereo_make` TEXT DEFAULT NULL,
  `cowl` TEXT DEFAULT NULL,
  `cabin` TEXT DEFAULT NULL,
  `front_excavator` TEXT DEFAULT NULL,
  `boom` TEXT DEFAULT NULL,
  `chassis_frame` TEXT DEFAULT NULL,
  `stepney` TEXT DEFAULT NULL,
  `left_mudguard` TEXT DEFAULT NULL,
  `grill` TEXT DEFAULT NULL,
  `front_body` TEXT DEFAULT NULL,
  `bonnet` TEXT DEFAULT NULL,
  `ac` TEXT DEFAULT NULL,
  `fuel_tank` TEXT DEFAULT NULL,
  `head_light` TEXT DEFAULT NULL,
  `right_mudguard` TEXT DEFAULT NULL,
  `dashboard` TEXT DEFAULT NULL,
  `right_body` TEXT DEFAULT NULL,
  `cran_bucket` TEXT DEFAULT NULL,
  `fans` TEXT DEFAULT NULL,
  `seats` TEXT DEFAULT NULL,
  `indicator_light` TEXT DEFAULT NULL,
  `cabin_lt_door` TEXT DEFAULT NULL,
  `crane_hook` TEXT DEFAULT NULL,
  `hydraulic_system` TEXT DEFAULT NULL,
  `tyres` TEXT DEFAULT NULL,
  `rear_body` TEXT DEFAULT NULL,
  `cabin_rt_door` TEXT DEFAULT NULL,
  `bumper` TEXT DEFAULT NULL,
  `left_body` TEXT DEFAULT NULL,
  `ws_glasses` TEXT DEFAULT NULL,
  `excavator_cabin_glass` TEXT DEFAULT NULL,
  `left_window_glass` TEXT DEFAULT NULL,
  `crane_cabin_glass` TEXT DEFAULT NULL,
  `right_window_glasses` TEXT DEFAULT NULL,
  `rear_view_body` TEXT DEFAULT NULL,
  `back_glass` TEXT DEFAULT NULL,
  `tail_lamp` TEXT DEFAULT NULL,
  `extra_fittings` TEXT DEFAULT NULL,
  `market_value` TEXT DEFAULT NULL,
  `chassisphoto` mediumtext DEFAULT NULL,
  `QC` int(11) NOT NULL DEFAULT 0 COMMENT '0- quanlity check pending,1- Quality check don',
  `qc_checked_by` TEXT DEFAULT NULL,
  `qc_datetime` datetime DEFAULT NULL,
  `ctime` TEXT NOT NULL,
  `inspection_status` TEXT DEFAULT NULL,
  `remarks` mediumtext DEFAULT NULL,
  `valuation_price` float DEFAULT NULL,
  `ownership_name` TEXT DEFAULT NULL,
  `video` mediumtext DEFAULT NULL,
  `s3video_url` TEXT DEFAULT NULL,
  `inspect_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;


CREATE TABLE IF NOT EXISTS `tbl_4wheeler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_id` int(11) DEFAULT NULL,
  `proposer` TEXT DEFAULT NULL,
  `insurer_broker` TEXT DEFAULT NULL,
  `insurer_ref_no` TEXT DEFAULT NULL,
  `ins_broker_name` TEXT DEFAULT NULL,
  `ins_broker_mobileno` TEXT DEFAULT NULL,
  `ins_broker_mailid` TEXT DEFAULT NULL,
  `ins_broker_agentcode` TEXT DEFAULT NULL,
  `inspection_case` TEXT DEFAULT NULL,
  `inspection_type` TEXT DEFAULT NULL,
  `inspection_place` mediumtext DEFAULT NULL,
  `vehicleno` TEXT DEFAULT NULL,
  `chassisno` TEXT DEFAULT NULL,
  `engineno` TEXT DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `model_id` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `year_of_manufacture` TEXT DEFAULT NULL,
  `odometer_reading` TEXT DEFAULT NULL,
  `rc_verified` TEXT DEFAULT NULL,
  `colour` TEXT DEFAULT NULL,
  `fuel_used` TEXT DEFAULT NULL,
  `stepney_make_dot_no` TEXT DEFAULT NULL,
  `rh_front_tyre_dot_no` TEXT DEFAULT NULL,
  `lh_front_tyre_dot_no` TEXT DEFAULT NULL,
  `lh_rear_tyre_dot_no` TEXT DEFAULT NULL,
  `stereo_make` TEXT DEFAULT NULL,
  `cd_charger_make` TEXT DEFAULT NULL,
  `other_electrical` TEXT DEFAULT NULL,
  `seat_cover` TEXT DEFAULT NULL,
  `center_lock` TEXT DEFAULT NULL,
  `gear_locking` TEXT DEFAULT NULL,
  `other_non_electrical` TEXT DEFAULT NULL,
  `front_bumper` TEXT DEFAULT NULL,
  `indicator_light_lt` TEXT DEFAULT NULL,
  `front_panel` TEXT DEFAULT NULL,
  `dicky` TEXT DEFAULT NULL,
  `grill` TEXT DEFAULT NULL,
  `indicator_light_rt` TEXT DEFAULT NULL,
  `bonnet` TEXT DEFAULT NULL,
  `reat_bumper` TEXT DEFAULT NULL,
  `head_lamp_lt` TEXT DEFAULT NULL,
  `fog_lamp_lt` TEXT DEFAULT NULL,
  `left_apron` TEXT DEFAULT NULL,
  `tail_lamp_lt` TEXT DEFAULT NULL,
  `head_lamp_rt` TEXT DEFAULT NULL,
  `fog_lamp_rt` TEXT DEFAULT NULL,
  `right_apron` TEXT DEFAULT NULL,
  `tail_lamp_rt` TEXT DEFAULT NULL,
  `lt_frontfender` TEXT DEFAULT NULL,
  `lt_pillar_door_a` TEXT DEFAULT NULL,
  `lt_frontdoor` TEXT DEFAULT NULL,
  `lt_pillar_center_b` TEXT DEFAULT NULL,
  `lt_reardoor` TEXT DEFAULT NULL,
  `lt_pillar_door_c` TEXT DEFAULT NULL,
  `lt_runningboard` TEXT DEFAULT NULL,
  `lt_qtr_panel` TEXT DEFAULT NULL,
  `rt_qtr_panel` TEXT DEFAULT NULL,
  `rt_pillar_door_b` TEXT DEFAULT NULL,
  `floor_silencer` TEXT DEFAULT NULL,
  `rt_rear_door` TEXT DEFAULT NULL,
  `rt_rear_pillar_c` TEXT DEFAULT NULL,
  `rear_view_mirror_lt` TEXT DEFAULT NULL,
  `rt_front_door` TEXT DEFAULT NULL,
  `rt_running_board` TEXT DEFAULT NULL,
  `rear_view_mirror_rt` TEXT DEFAULT NULL,
  `rt_front_pillar_a` TEXT DEFAULT NULL,
  `rt_front_fender` TEXT DEFAULT NULL,
  `tyres` TEXT DEFAULT NULL,
  `back_glass` TEXT DEFAULT NULL,
  `rf_door_glass` TEXT DEFAULT NULL,
  `lf_door_glass` TEXT DEFAULT NULL,
  `rh_rear_tyre_dot_no` TEXT DEFAULT NULL,
  `rim` TEXT DEFAULT NULL,
  `front_ws_glass_laminate` TEXT DEFAULT NULL,
  `rr_door_glass` TEXT DEFAULT NULL,
  `lr_door_glass` TEXT DEFAULT NULL,
  `under_carriage` TEXT DEFAULT NULL,
  `inspection_status` TEXT DEFAULT NULL,
  `remarks` mediumtext DEFAULT NULL,
  `valuation_price` float DEFAULT NULL,
  `ownership_name` TEXT DEFAULT NULL,
  `video` mediumtext DEFAULT NULL,
  `s3video_url` TEXT DEFAULT NULL,
  `chassisphoto` mediumtext DEFAULT NULL,
  `QC` int(11) NOT NULL DEFAULT 0 COMMENT '0- quanlity check pending,1- Quality check don',
  `qc_checked_by` TEXT DEFAULT NULL,
  `qc_datetime` datetime DEFAULT NULL,
  `ctime` TEXT NOT NULL,
  `inspect_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;


CREATE TABLE IF NOT EXISTS `tbl_jobs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `serial_no` int(11) NOT NULL,
  `dti_no` varchar(100) NOT NULL,
  `fin_year` varchar(100) NOT NULL,
  `bank_id` int(11) DEFAULT NULL,
  `bank_ref_no` varchar(200) DEFAULT NULL,
  `agent_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `model_id` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `cdate` date NOT NULL,
  `remark` text DEFAULT NULL,
  `cname` varchar(200) DEFAULT NULL,
  `mobileno` varchar(200) DEFAULT NULL,
  `address` text NOT NULL,
  `mode` varchar(100) DEFAULT NULL,
  `vehicleno` varchar(50) NOT NULL,
  `vehicle_type` varchar(100) DEFAULT NULL,
  `source` enum('APP','WEB') NOT NULL DEFAULT 'WEB',
  `created_user_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_user_id` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;


CREATE TABLE IF NOT EXISTS `tbl_jobs_office` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `serial_no` int(11) NOT NULL,
  `dti_no` varchar(100) NOT NULL,
  `fin_year` varchar(100) NOT NULL,
  `bank_id` int(11) NOT NULL,
  `bank_ref_no` varchar(200) NOT NULL,
  `agent_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `model_id` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `cdate` date NOT NULL,
  `remark` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `cname` varchar(200) DEFAULT NULL,
  `mobileno` varchar(200) DEFAULT NULL,
  `address` text NOT NULL,
  `mode` varchar(100) DEFAULT NULL,
  `vehicleno` varchar(50) DEFAULT NULL,
  `vehicle_type` varchar(100) DEFAULT NULL,
  `created_user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;


CREATE TABLE IF NOT EXISTS `tbl_office` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_id` int(11) DEFAULT NULL,
  `prospect_no` TEXT DEFAULT NULL,
  `applicant_name` TEXT DEFAULT NULL,
  `lead_id` TEXT DEFAULT NULL,
  `client_name` TEXT DEFAULT NULL,
  `cpv_result` TEXT DEFAULT NULL,
  `approved_by` TEXT DEFAULT NULL,
  `verifier_comment` mediumtext DEFAULT NULL,
  `supervisor_comment` mediumtext DEFAULT NULL,
  `location` mediumtext DEFAULT NULL,
  `is_reference` TEXT,
  `reference_detail` mediumtext DEFAULT NULL,
  `relation` TEXT DEFAULT NULL,
  `ref_mobile` TEXT DEFAULT NULL,
  `reference_name2` TEXT DEFAULT NULL,
  `reference_relation2` TEXT DEFAULT NULL,
  `reference_mobile2` TEXT DEFAULT NULL,
  `visit_status` TEXT DEFAULT NULL,
  `address` mediumtext DEFAULT NULL,
  `visit_date` date DEFAULT NULL,
  `visit_time` TEXT DEFAULT NULL,
  `vtime` time DEFAULT NULL,
  `remarks` mediumtext DEFAULT NULL,
  `video` mediumtext DEFAULT NULL,
  `s3video_url` TEXT DEFAULT NULL,
  `QC` int(11) NOT NULL DEFAULT 0 COMMENT '0- quanlity check pending,1- Quality check don',
  `qc_checked_by` TEXT DEFAULT NULL,
  `qc_datetime` datetime DEFAULT NULL,
  `inspect_by` int(11) NOT NULL,
  `screenshot` mediumtext DEFAULT NULL,
  `app_title` TEXT DEFAULT NULL,
  `ctime` TEXT NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;


CREATE TABLE IF NOT EXISTS `tbl_valuation_2wheeler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_id` int(11) DEFAULT NULL,
  `proposer` TEXT DEFAULT NULL,
  `insurer_broker` TEXT DEFAULT NULL,
  `inspection_place` TEXT DEFAULT NULL,
  `insurer_ref_no` TEXT DEFAULT NULL,
  `ins_broker_name` TEXT DEFAULT NULL,
  `ins_broker_mobileno` TEXT DEFAULT NULL,
  `ins_broker_mailid` TEXT DEFAULT NULL,
  `ins_broker_agentcode` TEXT DEFAULT NULL,
  `inspection_case` TEXT DEFAULT NULL,
  `inspection_type` TEXT DEFAULT NULL,
  `vehicleno` TEXT DEFAULT NULL,
  `chassisno` TEXT DEFAULT NULL,
  `engineno` TEXT DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `model_id` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `year_of_manufacture` TEXT DEFAULT NULL,
  `odometer_reading` TEXT DEFAULT NULL,
  `rc_verified` TEXT DEFAULT NULL,
  `helmetbox` TEXT DEFAULT NULL,
  `laggage_carrier` TEXT DEFAULT NULL,
  `stepney` TEXT DEFAULT NULL,
  `leggaurd` TEXT DEFAULT NULL,
  `saree_gaurd` TEXT DEFAULT NULL,
  `fron_left_ind_light` TEXT DEFAULT NULL,
  `fron_right_ind_light` TEXT DEFAULT NULL,
  `front_mudgaurd` TEXT DEFAULT NULL,
  `front_hub_disc_drum` TEXT DEFAULT NULL,
  `front_wheel_rim` TEXT DEFAULT NULL,
  `from_shock_absorber` TEXT DEFAULT NULL,
  `speedometer_tachometer` TEXT DEFAULT NULL,
  `lever_clutch_hand_break` TEXT DEFAULT NULL,
  `chassis_frame` TEXT DEFAULT NULL,
  `crankCase_cylinder` TEXT DEFAULT NULL,
  `head_lamp_rim` TEXT DEFAULT NULL,
  `silencer` TEXT DEFAULT NULL,
  `chain_cover` TEXT DEFAULT NULL,
  `fork` TEXT DEFAULT NULL,
  `fairing` TEXT DEFAULT NULL,
  `fuel_tank` TEXT DEFAULT NULL,
  `kick_padal` TEXT DEFAULT NULL,
  `handel_bar` TEXT DEFAULT NULL,
  `rear_wheel_rim` TEXT DEFAULT NULL,
  `rear_shock_absorber` TEXT DEFAULT NULL,
  `rear_drum_disc` TEXT DEFAULT NULL,
  `rear_left_indicator_light` TEXT DEFAULT NULL,
  `rear_right_indicator_light` TEXT DEFAULT NULL,
  `rear_view_mirror_lt` TEXT DEFAULT NULL,
  `rear_view_mirror_rt` TEXT DEFAULT NULL,
  `rear_foot_rest` TEXT DEFAULT NULL,
  `rear_mudguard` TEXT DEFAULT NULL,
  `left_cover_shield` TEXT DEFAULT NULL,
  `right_cover_shield` TEXT DEFAULT NULL,
  `wisor` TEXT DEFAULT NULL,
  `tail_lamp` TEXT DEFAULT NULL,
  `tyres_front` TEXT DEFAULT NULL,
  `leg_side_right` TEXT DEFAULT NULL,
  `leg_shield_left` TEXT DEFAULT NULL,
  `inspection_status` TEXT DEFAULT NULL,
  `rear_cowl_left_centre_right` TEXT DEFAULT NULL,
  `stepney_bracket` TEXT DEFAULT NULL,
  `remarks` mediumtext DEFAULT NULL,
  `valuation_price` float DEFAULT NULL,
  `ownership_name` TEXT DEFAULT NULL,
  `video` mediumtext DEFAULT NULL,
  `s3video_url` TEXT DEFAULT NULL,
  `chassisphoto` mediumtext DEFAULT NULL,
  `QC` int(11) NOT NULL DEFAULT 0 COMMENT '0- quanlity check pending,1- Quality check don',
  `qc_checked_by` TEXT DEFAULT NULL,
  `qc_datetime` datetime DEFAULT NULL,
  `is_price_valuation` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0-pending,1-done',
  `price_valuation_by` int(11) DEFAULT NULL,
  `price_valuation_datetime` datetime DEFAULT NULL,
  `inspect_by` int(11) NOT NULL,
  `ctime` TEXT NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;


CREATE TABLE IF NOT EXISTS `tbl_valuation_3wheeler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_id` int(11) DEFAULT NULL,
  `proposer` TEXT DEFAULT NULL,
  `insurer_broker` TEXT DEFAULT NULL,
  `insurer_ref_no` TEXT DEFAULT NULL,
  `ins_broker_name` TEXT DEFAULT NULL,
  `ins_broker_mobileno` TEXT DEFAULT NULL,
  `ins_broker_mailid` TEXT DEFAULT NULL,
  `ins_broker_agentcode` TEXT DEFAULT NULL,
  `inspection_case` TEXT DEFAULT NULL,
  `inspection_type` TEXT DEFAULT NULL,
  `inspection_place` mediumtext DEFAULT NULL,
  `vehicleno` TEXT DEFAULT NULL,
  `chassisno` TEXT DEFAULT NULL,
  `engineno` TEXT DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `model_id` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `year_of_manufacture` TEXT DEFAULT NULL,
  `odometer_reading` TEXT DEFAULT NULL,
  `rc_verified` TEXT DEFAULT NULL,
  `colour` TEXT DEFAULT NULL,
  `fuel_used` TEXT DEFAULT NULL,
  `tyre_of_body` TEXT DEFAULT NULL,
  `chassis_production_no` TEXT DEFAULT NULL,
  `stereo_make` TEXT DEFAULT NULL,
  `cowl` TEXT DEFAULT NULL,
  `cabin` TEXT DEFAULT NULL,
  `front_excavator` TEXT DEFAULT NULL,
  `boom` TEXT DEFAULT NULL,
  `chassis_frame` TEXT DEFAULT NULL,
  `stepney` TEXT DEFAULT NULL,
  `left_mudguard` TEXT DEFAULT NULL,
  `grill` TEXT DEFAULT NULL,
  `front_body` TEXT DEFAULT NULL,
  `bonnet` TEXT DEFAULT NULL,
  `ac` TEXT DEFAULT NULL,
  `fuel_tank` TEXT DEFAULT NULL,
  `head_light` TEXT DEFAULT NULL,
  `right_mudguard` TEXT DEFAULT NULL,
  `dashboard` TEXT DEFAULT NULL,
  `right_body` TEXT DEFAULT NULL,
  `cran_bucket` TEXT DEFAULT NULL,
  `fans` TEXT DEFAULT NULL,
  `seats` TEXT DEFAULT NULL,
  `indicator_light` TEXT DEFAULT NULL,
  `cabin_lt_door` TEXT DEFAULT NULL,
  `crane_hook` TEXT DEFAULT NULL,
  `hydraulic_system` TEXT DEFAULT NULL,
  `tyres` TEXT DEFAULT NULL,
  `rear_body` TEXT DEFAULT NULL,
  `cabin_rt_door` TEXT DEFAULT NULL,
  `bumper` TEXT DEFAULT NULL,
  `left_body` TEXT DEFAULT NULL,
  `ws_glasses` TEXT DEFAULT NULL,
  `excavator_cabin_glass` TEXT DEFAULT NULL,
  `left_window_glass` TEXT DEFAULT NULL,
  `crane_cabin_glass` TEXT DEFAULT NULL,
  `right_window_glasses` TEXT DEFAULT NULL,
  `rear_view_body` TEXT DEFAULT NULL,
  `back_glass` TEXT DEFAULT NULL,
  `tail_lamp` TEXT DEFAULT NULL,
  `extra_fittings` TEXT DEFAULT NULL,
  `market_value` TEXT DEFAULT NULL,
  `chassisphoto` mediumtext DEFAULT NULL,
  `QC` int(11) NOT NULL DEFAULT 0 COMMENT '0- quanlity check pending,1- Quality check don',
  `qc_checked_by` TEXT DEFAULT NULL,
  `qc_datetime` datetime DEFAULT NULL,
  `is_price_valuation` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0-pending,1-done',
  `price_valuation_by` int(11) DEFAULT NULL,
  `price_valuation_datetime` datetime DEFAULT NULL,
  `ctime` TEXT NOT NULL,
  `inspection_status` TEXT DEFAULT NULL,
  `remarks` mediumtext DEFAULT NULL,
  `valuation_price` float DEFAULT NULL,
  `ownership_name` TEXT DEFAULT NULL,
  `video` mediumtext DEFAULT NULL,
  `s3video_url` TEXT DEFAULT NULL,
  `inspect_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;


CREATE TABLE IF NOT EXISTS `tbl_valuation_4wheeler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_id` int(11) DEFAULT NULL,
  `proposer` TEXT DEFAULT NULL,
  `insurer_broker` TEXT DEFAULT NULL,
  `insurer_ref_no` TEXT DEFAULT NULL,
  `ins_broker_name` TEXT DEFAULT NULL,
  `ins_broker_mobileno` TEXT DEFAULT NULL,
  `ins_broker_mailid` TEXT DEFAULT NULL,
  `ins_broker_agentcode` TEXT DEFAULT NULL,
  `inspection_case` TEXT DEFAULT NULL,
  `inspection_type` TEXT DEFAULT NULL,
  `inspection_place` mediumtext DEFAULT NULL,
  `vehicleno` TEXT DEFAULT NULL,
  `chassisno` TEXT DEFAULT NULL,
  `engineno` TEXT DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `model_id` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `year_of_manufacture` TEXT DEFAULT NULL,
  `odometer_reading` TEXT DEFAULT NULL,
  `rc_verified` TEXT DEFAULT NULL,
  `colour` TEXT DEFAULT NULL,
  `fuel_used` TEXT DEFAULT NULL,
  `stepney_make_dot_no` TEXT DEFAULT NULL,
  `rh_front_tyre_dot_no` TEXT DEFAULT NULL,
  `lh_front_tyre_dot_no` TEXT DEFAULT NULL,
  `lh_rear_tyre_dot_no` TEXT DEFAULT NULL,
  `stereo_make` TEXT DEFAULT NULL,
  `cd_charger_make` TEXT DEFAULT NULL,
  `other_electrical` TEXT DEFAULT NULL,
  `seat_cover` TEXT DEFAULT NULL,
  `center_lock` TEXT DEFAULT NULL,
  `gear_locking` TEXT DEFAULT NULL,
  `other_non_electrical` TEXT DEFAULT NULL,
  `front_bumper` TEXT DEFAULT NULL,
  `indicator_light_lt` TEXT DEFAULT NULL,
  `front_panel` TEXT DEFAULT NULL,
  `dicky` TEXT DEFAULT NULL,
  `grill` TEXT DEFAULT NULL,
  `indicator_light_rt` TEXT DEFAULT NULL,
  `bonnet` TEXT DEFAULT NULL,
  `reat_bumper` TEXT DEFAULT NULL,
  `head_lamp_lt` TEXT DEFAULT NULL,
  `fog_lamp_lt` TEXT DEFAULT NULL,
  `left_apron` TEXT DEFAULT NULL,
  `tail_lamp_lt` TEXT DEFAULT NULL,
  `head_lamp_rt` TEXT DEFAULT NULL,
  `fog_lamp_rt` TEXT DEFAULT NULL,
  `right_apron` TEXT DEFAULT NULL,
  `tail_lamp_rt` TEXT DEFAULT NULL,
  `lt_frontfender` TEXT DEFAULT NULL,
  `lt_pillar_door_a` TEXT DEFAULT NULL,
  `lt_frontdoor` TEXT DEFAULT NULL,
  `lt_pillar_center_b` TEXT DEFAULT NULL,
  `lt_reardoor` TEXT DEFAULT NULL,
  `lt_pillar_door_c` TEXT DEFAULT NULL,
  `lt_runningboard` TEXT DEFAULT NULL,
  `lt_qtr_panel` TEXT DEFAULT NULL,
  `rt_qtr_panel` TEXT DEFAULT NULL,
  `rt_pillar_door_b` TEXT DEFAULT NULL,
  `floor_silencer` TEXT DEFAULT NULL,
  `rt_rear_door` TEXT DEFAULT NULL,
  `rt_rear_pillar_c` TEXT DEFAULT NULL,
  `rear_view_mirror_lt` TEXT DEFAULT NULL,
  `rt_front_door` TEXT DEFAULT NULL,
  `rt_running_board` TEXT DEFAULT NULL,
  `rear_view_mirror_rt` TEXT DEFAULT NULL,
  `rt_front_pillar_a` TEXT DEFAULT NULL,
  `rt_front_fender` TEXT DEFAULT NULL,
  `tyres` TEXT DEFAULT NULL,
  `back_glass` TEXT DEFAULT NULL,
  `rf_door_glass` TEXT DEFAULT NULL,
  `lf_door_glass` TEXT DEFAULT NULL,
  `fog_lamps` TEXT DEFAULT NULL,
  `rh_rear_tyre_dot_no` TEXT DEFAULT NULL,
  `rim` TEXT DEFAULT NULL,
  `front_ws_glass_laminate` TEXT DEFAULT NULL,
  `rr_door_glass` TEXT DEFAULT NULL,
  `lr_door_glass` TEXT DEFAULT NULL,
  `under_carriage` TEXT DEFAULT NULL,
  `others` TEXT DEFAULT NULL,
  `inspection_status` TEXT DEFAULT NULL,
  `remarks` mediumtext DEFAULT NULL,
  `valuation_price` float DEFAULT NULL,
  `ownership_name` TEXT DEFAULT NULL,
  `video` mediumtext DEFAULT NULL,
  `s3video_url` TEXT DEFAULT NULL,
  `chassisphoto` mediumtext DEFAULT NULL,
  `QC` int(11) NOT NULL DEFAULT 0 COMMENT '0- quanlity check pending,1- Quality check don',
  `qc_checked_by` TEXT DEFAULT NULL,
  `qc_datetime` datetime DEFAULT NULL,
  `is_price_valuation` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0-pending,1-done',
  `price_valuation_by` int(11) DEFAULT NULL,
  `price_valuation_datetime` datetime DEFAULT NULL,
  `ctime` TEXT NOT NULL,
  `rating` int(11) DEFAULT NULL,
  `conditions` mediumtext DEFAULT NULL,
  `date_of_registration` date DEFAULT NULL,
  `insurance` TEXT DEFAULT NULL,
  `hpa_financier` TEXT DEFAULT NULL,
  `battery` TEXT DEFAULT NULL,
  `odometer` TEXT DEFAULT NULL,
  `front_body` TEXT DEFAULT NULL,
  `left_body` TEXT DEFAULT NULL,
  `door` TEXT DEFAULT NULL,
  `rear_body` TEXT DEFAULT NULL,
  `right_body` TEXT DEFAULT NULL,
  `body_condition` TEXT DEFAULT NULL,
  `lt_side_gate` TEXT DEFAULT NULL,
  `rt_side_gate` TEXT DEFAULT NULL,
  `engine_condition` TEXT DEFAULT NULL,
  `cubic_capacity` TEXT DEFAULT NULL,
  `body_type` TEXT DEFAULT NULL,
  `brake_system` TEXT DEFAULT NULL,
  `front_rt` TEXT DEFAULT NULL,
  `front_lt` TEXT DEFAULT NULL,
  `rear_rt` TEXT DEFAULT NULL,
  `rear_lt` TEXT DEFAULT NULL,
  `spare_wheel` TEXT DEFAULT NULL,
  `over_all` TEXT DEFAULT NULL,
  `dashboard` TEXT DEFAULT NULL,
  `transmission_type` TEXT DEFAULT NULL,
  `seating_capacity` TEXT DEFAULT NULL,
  `is_ac` TEXT DEFAULT NULL,
  `air_bag` TEXT DEFAULT NULL,
  `steering` TEXT DEFAULT NULL,
  `sunroof` TEXT DEFAULT NULL,
  `number_plate` TEXT DEFAULT NULL,
  `vc_type` TEXT DEFAULT NULL,
  `troly` TEXT DEFAULT NULL,
  `paint` TEXT DEFAULT NULL,
  `lift` TEXT DEFAULT NULL,
  `start_condition` TEXT DEFAULT NULL,
  `left_mudguard` TEXT DEFAULT NULL,
  `right_mudguard` TEXT DEFAULT NULL,
  `power` TEXT DEFAULT NULL,
  `any_tyre_missing` TEXT DEFAULT NULL,
  `seat_condition` TEXT DEFAULT NULL,
  `gross_weight_kg` TEXT DEFAULT NULL,
  `other_repair` TEXT DEFAULT NULL,
  `inspect_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;


-- PI gallery + permissions tables
CREATE TABLE IF NOT EXISTS `tbl_2wheeler_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT NULL,
  `image` mediumtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_2w_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `tbl_3wheeler_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT NULL,
  `image` mediumtext DEFAULT NULL,
  `s3_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_3w_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `tbl_4wheeler_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT NULL,
  `image` mediumtext DEFAULT NULL,
  `s3_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_4w_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS `user_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `permission` varchar(255) NOT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_permissions_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ===== SEED =====

-- Demo admin: demo@demo.com / demo
INSERT IGNORE INTO `users` (
  `first_name`, `last_name`, `email`, `password`,
  `type`, `is_admin`, `status`, `is_deleted`, `verified_at`, `created_at`, `updated_at`
) VALUES (
  'Demo', 'Admin', 'demo@demo.com',
  '$2b$10$.5Xb.vSCP9qlkKJ9sMEFquUsudS6SUcCGzzKcjsO7706dJP2sA79i',
  '', 1, 'Active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT IGNORE INTO `m_city` (`id`, `name`, `created_at`, `updated_at`)
VALUES (1, 'Mumbai', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT IGNORE INTO `m_bank` (`id`, `name`, `contact_person`, `phone`, `emailid`, `pincode`, `ifsc`, `created_at`, `updated_at`)
VALUES (1, 'Demo Bank', 'Contact', '9999999999', 'bank@demo.com', '400001', 'DEMO0000001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT IGNORE INTO `m_company` (`id`, `name`, `created_at`, `updated_at`)
VALUES (1, 'Demo Company', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT IGNORE INTO `m_model` (`id`, `company_id`, `name`, `created_at`, `updated_at`)
VALUES (1, 1, 'Demo Model', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT IGNORE INTO `m_variant` (`id`, `company_id`, `model_id`, `name`, `vehicle_type`, `created_at`, `updated_at`)
VALUES (1, 1, 1, 'Demo Variant', '2wheeler', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT IGNORE INTO `fin_year` (`id`, `fsession`, `ffrom`, `fto`)
VALUES (1, '2025-26', '2025-04-01', '2026-03-31');

SET FOREIGN_KEY_CHECKS = 1;
