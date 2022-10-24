#!/usr/bin/perl
use Getopt::Long;
my $path = '';	# option variable with default value
GetOptions ('f=s' => \$path);

# use v5.32;
# my $fn = "./stage/node-enabled/server.ts";
# my $out_path = "./stage/node-enabled/server_.ts";
my $out_path = "$path";
# my $out = ""
use feature qw/say/;
use autodie;

# https://www.perl.com/article/45/2013/10/27/How-to-redirect-and-restore-STDOUT/
# do {
#     local *STDOUT;

#     # redirect STDOUT to log.txt
#     open (STDOUT, '>>', 'log.txt');

#     say 'This should be logged.';
# };
# say "fn: $fn";
if( $path =~ /[\\\/]{1}([^\\\/\.]*)\.ts$/ ) {
    $filename = $1
} else {
    die "file is not typescript: $!";
}


open ( IN, $path) or die "Cannot open file: $!";

use constant { true => 1, false => 0 };
$loose = false;
$pad = 8;

while ( $line = <IN> ) {
    $ln = $.;
    # (?:(?!ab).)*
    if( $loose ) {
        $loose = false;
        # push(@out, "\"_____x___\",\n");
        if("$line" =~ /([\s\t]*).*/ ) {
            $s = "$1";
            if( "$line" =~ /(?=lev)|(?:\d{1, 2})/ ) {
                push(@out, "$line");
                push(@out, sprintf "$s\"%-6s:%03d|\",\n", $pad, $filename, $ln);
            } else {
                push(@out, sprintf "$s\"%-8s:%03d|\",\n", $pad, $filename, $ln);
                push(@out, "$line");
            }
        }
    } else {
        if( $line =~ /^(?<prefix>.*(?:(?!console).\.)|[^\.]){1}(?<logtype>(?:log)|(?:accent)|(?:forky)|(?:errata))+\((?<args>.+?(?:(?=\);\n)|\n)+)/ ) {
            if ( index("$+{prefix}", "console") ne -1 ) {
                push(@out, $line);
                next;
            }
            $log_line = "$+{prefix}$+{logtype}\(";
            $args = "$+{args}";
            if( $args =~ /(?<first>[^,]*), (?<rest>.*)/ ) {
                $first="$+{first}";
                $rest="$+{rest}";
                if ( $first =~ /(?=lev)|(?:\d{1, 2})/ ) {
                    push(@out, sprintf "$log_line$first, \"%-*s:%03d|\", $rest\n", $pad, $filename, $ln);
                } else {
                    push(@out, sprintf "$log_line\"%-*s:%03d|\", $first, $rest\n", $pad, $filename, $ln);
                }
                next;
            }
            # Single string arg
            if ( index($args, ");") ne -1 ) {
                push(@out, sprintf "$log_line\"%-*s:%03d|\", $args", $pad, $filename, $ln);
                next;
            } 
            
            # say "args?: $args";
            # multiline
            $loose = true;
            push(@out, $log_line);
            next;
        }
        push(@out, $line);
    }
}

open ( OUTFILE, ">$out_path" );
print ( OUTFILE @out );
close ( OUTFILE );

# https://stackoverflow.com/questions/977251/regular-expressions-and-negating-a-whole-character-group
# ^(?:(?!ab).)+$

# And the above expression disected in regex comment mode is:

# (?x)    # enable regex comment mode
# ^       # match start of line/string
# (?:     # begin non-capturing group
#   (?!   # begin negative lookahead
#     ab  # literal text sequence ab
#   )     # end negative lookahead
#   .     # any single character
# )       # end non-capturing group
# +       # repeat previous match one or more times
# $       # match end of line/string