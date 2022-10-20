CREATE TABLE IF NOT EXISTS `soundboard`.`users` (
    `id` INT UNSIGNED NOT NULL,
    `username` VARCHAR(16) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` BINARY(32) NOT NULL,
    `create_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
);