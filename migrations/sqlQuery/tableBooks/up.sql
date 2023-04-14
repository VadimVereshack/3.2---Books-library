CREATE TABLE books (
    id int(11) PRIMARY KEY AUTO_INCREMENT,
    name varchar(255),
    img varchar(255),
    year varchar(255),
    numberPages varchar(255),
    info TEXT,
    clickBook int(11),
    clickRead int(11),
    isTrash	VARCHAR(5)
);