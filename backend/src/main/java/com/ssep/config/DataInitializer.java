package com.ssep.config;

import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           EmployeeRepository employeeRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedEmployees();
    }

    private void seedUsers() {
        if (!userRepository.existsByEmail("ceo@ssep.com")) {
            User ceo = new User();
            ceo.setName("CEO SSEP");
            ceo.setEmail("ceo@ssep.com");
            ceo.setPasswordHash(passwordEncoder.encode("password123"));
            ceo.setRole("CEO");
            ceo.setStatus("ACTIVE");
            userRepository.save(ceo);
        }

        if (!userRepository.existsByEmail("admin@ssep.com")) {
            User admin = new User();
            admin.setName("Admin SSEP");
            admin.setEmail("admin@ssep.com");
            admin.setPasswordHash(passwordEncoder.encode("password123"));
            admin.setRole("ADMIN");
            admin.setStatus("ACTIVE");
            userRepository.save(admin);
        }
    }

    private void seedEmployees() {
        if (employeeRepository.count() == 0) {
            LocalDate today = LocalDate.now();

            Employee ali = new Employee();
            ali.setEmployeeCode("EMP-001");
            ali.setName("Ali");
            ali.setPhone("012-3456789");
            ali.setAddress("Kampung Melayu, Selangor");
            ali.setDailyRate(new BigDecimal("80.00"));
            ali.setStartDate(today.minusMonths(3));
            ali.setStatus("ACTIVE");
            ali.setNotes("Pekerja am");
            employeeRepository.save(ali);

            Employee ahmad = new Employee();
            ahmad.setEmployeeCode("EMP-002");
            ahmad.setName("Ahmad");
            ahmad.setPhone("013-9876543");
            ahmad.setAddress("Taman Jaya, Selangor");
            ahmad.setDailyRate(new BigDecimal("70.00"));
            ahmad.setStartDate(today.minusMonths(2));
            ahmad.setStatus("ACTIVE");
            ahmad.setNotes("Pekerja operasi");
            employeeRepository.save(ahmad);

            Employee siti = new Employee();
            siti.setEmployeeCode("EMP-003");
            siti.setName("Siti");
            siti.setPhone("019-1234567");
            siti.setAddress("Shah Alam, Selangor");
            siti.setDailyRate(new BigDecimal("80.00"));
            siti.setStartDate(today.minusMonths(1));
            siti.setStatus("ACTIVE");
            siti.setNotes("Penyelia tapak");
            employeeRepository.save(siti);

            Employee johan = new Employee();
            johan.setEmployeeCode("EMP-004");
            johan.setName("Johan");
            johan.setPhone("017-8899001");
            johan.setAddress("Klang, Selangor");
            johan.setDailyRate(new BigDecimal("90.00"));
            johan.setStartDate(today.minusMonths(6));
            johan.setStatus("INACTIVE");
            johan.setNotes("Pekerja tidak aktif (berhenti kerja)");
            employeeRepository.save(johan);
        }
    }
}
