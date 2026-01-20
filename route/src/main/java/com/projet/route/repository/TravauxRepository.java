package com.projet.route.repository;

import com.projet.route.models.Travaux;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TravauxRepository extends JpaRepository<Travaux, Long> {
    Optional<Travaux> findBySignalementIdSignalement(Long idSignalement);
    List<Travaux> findByAvancementLessThan(BigDecimal avancement);
    List<Travaux> findByDateDebutTravauxBetween(LocalDate start, LocalDate end);
}
