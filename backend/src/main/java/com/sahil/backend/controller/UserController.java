package com.sahil.backend.controller;

import com.sahil.backend.model.UserProfile;
import com.sahil.backend.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * GET /api/users/{id} - Fetch user profile data
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable String id) {
        Optional<UserProfile> userProfile = userProfileRepository.findById(id);
        
        if (userProfile.isEmpty()) {
            // Return minimal response if user doesn't exist yet
            Map<String, Object> response = new HashMap<>();
            response.put("id", id);
            response.put("email", "");
            response.put("fullName", "");
            response.put("organization", "");
            return ResponseEntity.ok(response);
        }

        UserProfile u = userProfile.get();
        Map<String, Object> response = new HashMap<>();
        response.put("id", u.getSupabaseId());
        response.put("email", u.getEmail());
        response.put("fullName", u.getFullName());
        response.put("organization", u.getOrganization());

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/users/{id} - Update user profile (name, organization)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUserProfile(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<UserProfile> userOpt = userProfileRepository.findById(id);
        
        UserProfile user;
        if (userOpt.isEmpty()) {
            // Create new user profile if it doesn't exist
            user = new UserProfile(id, body.getOrDefault("email", ""));
        } else {
            user = userOpt.get();
        }
        
        if (body.containsKey("fullName")) {
            user.setFullName(body.get("fullName"));
        }
        if (body.containsKey("organization")) {
            user.setOrganization(body.get("organization"));
        }
        if (body.containsKey("email")) {
            user.setEmail(body.get("email"));
        }

        userProfileRepository.save(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getSupabaseId());
        response.put("email", user.getEmail());
        response.put("fullName", user.getFullName());
        response.put("organization", user.getOrganization());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/users/{id}/preferences - Fetch user preferences
     */
    @GetMapping("/{id}/preferences")
    public ResponseEntity<?> getUserPreferences(@PathVariable String id) {
        Optional<UserProfile> userProfile = userProfileRepository.findById(id);
        
        UserProfile u;
        if (userProfile.isEmpty()) {
            u = new UserProfile(id, "");
        } else {
            u = userProfile.get();
        }

        Map<String, String> response = new HashMap<>();
        response.put("timezone", u.getTimezone());
        response.put("dateFormat", u.getDateFormat());
        response.put("numberFormat", u.getNumberFormat());

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/users/{id}/preferences - Update user preferences
     */
    @PutMapping("/{id}/preferences")
    public ResponseEntity<?> updateUserPreferences(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<UserProfile> userOpt = userProfileRepository.findById(id);
        
        UserProfile user;
        if (userOpt.isEmpty()) {
            user = new UserProfile(id, body.getOrDefault("email", ""));
        } else {
            user = userOpt.get();
        }
        
        if (body.containsKey("timezone")) {
            user.setTimezone(body.get("timezone"));
        }
        if (body.containsKey("dateFormat")) {
            user.setDateFormat(body.get("dateFormat"));
        }
        if (body.containsKey("numberFormat")) {
            user.setNumberFormat(body.get("numberFormat"));
        }

        userProfileRepository.save(user);
        
        Map<String, String> response = new HashMap<>();
        response.put("timezone", user.getTimezone());
        response.put("dateFormat", user.getDateFormat());
        response.put("numberFormat", user.getNumberFormat());

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/users/{id}/change-password - Change user password
     * Note: Password management should be handled by Supabase in production
     */
    @PostMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable String id, @RequestBody Map<String, String> body) {
        // In production, integrate with Supabase Auth API
        // For now, return success message
        return ResponseEntity.ok(Map.of("message", "Please use Supabase to change your password"));
    }

    /**
     * GET /api/users/{id}/export - Export user's migration data
     */
    @GetMapping("/{id}/export")
    public ResponseEntity<?> exportUserData(@PathVariable String id) {
        Optional<UserProfile> userOpt = userProfileRepository.findById(id);
        
        UserProfile user;
        if (userOpt.isEmpty()) {
            user = new UserProfile(id, "");
        } else {
            user = userOpt.get();
        }
        
        // Create export data
        Map<String, Object> exportData = new HashMap<>();
        exportData.put("exportDate", System.currentTimeMillis());
        exportData.put("userId", user.getSupabaseId());
        exportData.put("email", user.getEmail());
        exportData.put("fullName", user.getFullName());
        exportData.put("organization", user.getOrganization());
        exportData.put("preferences", Map.of(
            "timezone", user.getTimezone(),
            "dateFormat", user.getDateFormat(),
            "numberFormat", user.getNumberFormat()
        ));
        
        // TODO: Add migration history when available
        exportData.put("migrations", new Object[]{});

        return ResponseEntity.ok(exportData);
    }

    /**
     * DELETE /api/users/{id} - Delete user account
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAccount(@PathVariable String id) {
        Optional<UserProfile> userOpt = userProfileRepository.findById(id);
        
        if (userOpt.isPresent()) {
            userProfileRepository.deleteById(id);
        }

        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }
}
