use std::env;

use std::fs;



fn main() {

    let args: Vec<String> = env::args().collect();



    if args.len() < 2 {

        println!("Steel CLI");

        println!("Usage:");

        println!("  steel run <file>");

        return;

    }



    match args[1].as_str() {

        "run" => {

            if args.len() < 3 {

                println!("No file provided");

                return;

            }



            let filename = &args[2];



            let content = fs::read_to_string(filename)

                .expect("Failed to read file");



            println!("Running Steel file:\n");

            println!("{}", content);



            println!("\n[Steel execution simulated]");

        }



        _ => {

            println!("Unknown command");

        }

    }

}