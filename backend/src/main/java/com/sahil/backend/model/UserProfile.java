package com.sahil.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "user_profiles")
public class UserProfile {
    @Id
    @Column(name = "supabase_id")
    private String supabaseId;

    @Column(name = "email")
    private String email;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "organization")
    private String organization;

    @Column(name = "timezone")
    private String timezone = "UTC";

    @Column(name = "date_format")
    private String dateFormat = "MM/DD/YYYY";

    @Column(name = "number_format")
    private String numberFormat = "1,234.56";

    public UserProfile() {
    }

    public UserProfile(String supabaseId, String email) {
        this.supabaseId = supabaseId;
        this.email = email;
        this.timezone = "UTC";
        this.dateFormat = "MM/DD/YYYY";
        this.numberFormat = "1,234.56";
    }

    public String getSupabaseId() {
        return supabaseId;
    }

    public void setSupabaseId(String supabaseId) {
        this.supabaseId = supabaseId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getOrganization() {
        return organization;
    }

    public void setOrganization(String organization) {
        this.organization = organization;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getDateFormat() {
        return dateFormat;
    }

    public void setDateFormat(String dateFormat) {
        this.dateFormat = dateFormat;
    }

    public String getNumberFormat() {
        return numberFormat;
    }

    public void setNumberFormat(String numberFormat) {
        this.numberFormat = numberFormat;
    }
}
